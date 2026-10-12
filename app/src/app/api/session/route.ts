import { NextResponse, type NextRequest } from 'next/server';

import { env } from '@/env';
import {
  clearSessionCookies,
  SESSION_COOKIE_NAME,
  sessionNeedsRefresh,
  sessionTtlSeconds,
  setSessionCookies,
} from '@/lib/session-cookie';
import type { Session, User } from '@/types';

export async function POST(request: NextRequest) {
  const credentials = await request.text();
  const login = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: credentials,
    cache: 'no-store',
  });
  if (!login.ok) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const retryAfter = login.headers.get('Retry-After');
    if (retryAfter) {
      headers['Retry-After'] = retryAfter;
    }
    return new NextResponse(await login.text(), {
      status: login.status,
      headers,
    });
  }

  const session = (await login.json()) as Session;
  let user: User | null = null;
  let profileStatus = 502;
  try {
    const profile = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/sessions/${encodeURIComponent(session.sessionId)}`,
      { cache: 'no-store' }
    );
    profileStatus = profile.status;
    if (profile.ok) {
      const detail = (await profile.json()) as { sessionId: string; user?: User | null };
      user = detail.user ?? null;
    }
  } catch {
    profileStatus = 502;
  }

  if (!user) {
    try {
      await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/${encodeURIComponent(session.sessionId)}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
    } catch {
      // Best-effort cleanup when user profile lookup fails.
    }
    return NextResponse.json(
      { detail: 'Unable to load authenticated user profile' },
      { status: profileStatus >= 400 ? profileStatus : 502 }
    );
  }

  const response = NextResponse.json({ user });
  setSessionCookies(response, request, session.sessionId, session.expiresInSeconds);
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ detail: 'Session not found' }, { status: 401 });

  let profile: Response;
  try {
    profile = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ detail: 'Session service unavailable' }, { status: 502 });
  }

  if (profile.status === 401 || profile.status === 404) {
    const response = NextResponse.json({ detail: 'Session expired' }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }
  if (!profile.ok) {
    return NextResponse.json({ detail: 'Session service unavailable' }, { status: 502 });
  }

  const detail = (await profile.json()) as { user?: User | null };
  if (!detail.user) {
    return NextResponse.json({ detail: 'Session profile unavailable' }, { status: 502 });
  }
  const response = NextResponse.json({ user: detail.user });
  if (sessionNeedsRefresh(request)) {
    setSessionCookies(response, request, token, sessionTtlSeconds(request));
  }
  return response;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let revoked = true;
  if (token) {
    try {
      const result = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/sessions/${encodeURIComponent(token)}`,
        {
          method: 'DELETE',
          cache: 'no-store',
        }
      );
      revoked = result.ok;
    } catch {
      revoked = false;
    }
  }
  const response = new NextResponse(null, { status: revoked ? 204 : 502 });
  clearSessionCookies(response);
  return response;
}
