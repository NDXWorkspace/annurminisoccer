import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_NAME, sessionSecretBytes } from './lib/session';

const SESSION_SECRET = sessionSecretBytes();

/** Samakan '/admin/login' dan '/admin/login/' supaya tidak terjebak guard. */
function normalise(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export async function proxy(request: NextRequest) {
  const pathname = normalise(request.nextUrl.pathname);

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(sessionCookie, SESSION_SECRET);
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Delete corrupted/expired cookie
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // If already logged in and visiting /admin/login, redirect to /admin dashboard
  if (pathname === '/admin/login') {
    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
    if (sessionCookie) {
      try {
        await jwtVerify(sessionCookie, SESSION_SECRET);
        return NextResponse.redirect(new URL('/admin', request.url));
      } catch {
        // Invalid session, let user stay on login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
