import { NextResponse } from 'next/server';
import { createSession, verifyPassword, COOKIE_NAME, SESSION_DURATION } from '@/lib/auth';
import { cookies } from 'next/headers';

const rateLimit = new Map<string, { count: number; timestamp: number }>();

function touchRateLimit(ip: string, now: number): boolean {
  // Sweep stale entries so the map cannot grow without bound.
  if (rateLimit.size > 500) {
    for (const [key, rec] of rateLimit) {
      if (now - rec.timestamp >= 60000) rateLimit.delete(key);
    }
  }
  const rec = rateLimit.get(ip);
  if (!rec || now - rec.timestamp >= 60000) {
    rateLimit.set(ip, { count: 1, timestamp: now });
    return true;
  }
  if (rec.count >= 5) return false;
  rec.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!touchRateLimit(ip, Date.now())) {
      return NextResponse.json({ success: false, error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' }, { status: 429 });
    }

    const { password } = await request.json();

    const isPasswordValid = await verifyPassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Password salah' }, { status: 401 });
    }

    const token = await createSession();
    
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: parseInt(String(SESSION_DURATION), 10) || 86400,
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
