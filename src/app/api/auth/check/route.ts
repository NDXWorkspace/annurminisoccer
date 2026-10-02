import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ success: true, authenticated: true, data: { username: session.username, role: session.role } });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ success: false, authenticated: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
