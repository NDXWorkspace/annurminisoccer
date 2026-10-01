import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const isValid = await getSessionFromCookies();
    if (!isValid) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ success: true, authenticated: true });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ success: false, authenticated: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
