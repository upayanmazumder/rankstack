import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/contests', '/submissions', '/teams', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  // Auth token is written to cookies by the persist middleware (key: auth-store).
  // We read the raw cookie and parse the persisted Zustand state.
  const raw = request.cookies.get('auth-store')?.value;

  let token: string | null = null;
  try {
    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw)) as {
        state?: { token?: string | null };
      };
      token = parsed?.state?.token ?? null;
    }
  } catch {
    // malformed cookie — treat as unauthenticated
  }

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/contests/:path*', '/submissions/:path*', '/teams/:path*', '/admin/:path*'],
};
