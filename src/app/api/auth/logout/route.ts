import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, getSession } from '@/lib/auth';
import { audit } from '@/lib/admin-users';

export async function POST() {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    await audit(session, 'logout', 'auth');
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
