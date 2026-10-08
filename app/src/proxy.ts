import { NextResponse, type NextRequest } from 'next/server';

import { env } from '@/env';

const PROTECTED_PREFIXES = ['/submissions', '/teams', '/admin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    !PROTECTED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('rankstack-session')?.value;
  if (token) {
    try {
      const result = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/sessions/${encodeURIComponent(token)}`,
        { cache: 'no-store' }
      );
      if (result.ok) return NextResponse.next();
    } catch {
      // Fail closed if the session service cannot verify the token.
    }
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('from', `${pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('rankstack-session');
  return response;
}

export const config = {
  matcher: ['/submissions/:path*', '/teams/:path*', '/admin/:path*'],
};
