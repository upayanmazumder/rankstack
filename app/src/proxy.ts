import { NextResponse, type NextRequest } from 'next/server';

import { env } from '@/env';
import { clearSessionCookies, SESSION_COOKIE_NAME } from '@/lib/session-cookie';

const PROTECTED_PREFIXES = ['/submissions', '/teams', '/admin'];
/** Pages for signed-out visitors. A signed-in user goes to the contests page instead. */
const GUEST_ONLY_PATHS = ['/login', '/register'];
const SIGNED_IN_HOME = '/contests';

type SessionState = 'valid' | 'invalid' | 'unknown';

/**
 * Checks the session cookie against the API. `unknown` means the API could not
 * answer (network failure or server error), so the caller must not act on it.
 */
async function sessionState(request: NextRequest): Promise<SessionState> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return 'invalid';
  try {
    const result = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/current`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.ok) return 'valid';
    return result.status === 401 || result.status === 404 ? 'invalid' : 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isUnder = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  if (GUEST_ONLY_PATHS.some(isUnder)) {
    if ((await sessionState(request)) !== 'valid') return NextResponse.next();
    const home = request.nextUrl.clone();
    home.pathname = SIGNED_IN_HOME;
    home.search = '';
    return NextResponse.redirect(home);
  }

  if (!PROTECTED_PREFIXES.some(isUnder)) return NextResponse.next();
  if ((await sessionState(request)) !== 'invalid') return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('from', `${pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);
  clearSessionCookies(response);
  return response;
}

export const config = {
  matcher: ['/submissions/:path*', '/teams/:path*', '/admin/:path*', '/login', '/register'],
};
