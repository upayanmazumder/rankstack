import { NextResponse, type NextRequest } from 'next/server';

import { env } from '@/env';
import { clearSessionCookies, SESSION_COOKIE_NAME } from '@/lib/session-cookie';

const PROTECTED_PREFIXES = ['/submissions', '/teams', '/admin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    !PROTECTED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      const result = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/current`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (result.ok) return NextResponse.next();
      if (result.status !== 401 && result.status !== 404) return NextResponse.next();
    } catch {
      return NextResponse.next();
    }
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('from', `${pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);
  clearSessionCookies(response);
  return response;
}

export const config = {
  matcher: ['/submissions/:path*', '/teams/:path*', '/admin/:path*'],
};
