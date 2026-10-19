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

const noStoreHeaders = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  const origin = request.headers.get('origin');
  const sameSite = request.headers.get('sec-fetch-site');
  let isSameOrigin = false;
  if (origin) {
    try {
      isSameOrigin = new URL(origin).origin === request.nextUrl.origin;
    } catch {
      // Opaque or malformed origins cannot authorize a login.
    }
  }
  const isSameSiteRequest = sameSite === 'same-origin';
  const isJson = contentType.split(';', 1)[0]?.trim().toLowerCase() === 'application/json';

  if (!isJson || (!isSameOrigin && !isSameSiteRequest)) {
    return new NextResponse(JSON.stringify({ detail: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...noStoreHeaders },
    });
  }

  const credentials = await request.text();
  const login = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: credentials,
    cache: 'no-store',
  });
  if (!login.ok) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...noStoreHeaders,
    };
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
    const profile = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/current`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${session.sessionId}` },
    });
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
      await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/current`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${session.sessionId}` },
      });
    } catch {
      // Best-effort cleanup when user profile lookup fails.
    }
    return NextResponse.json(
      { detail: 'Unable to load authenticated user profile' },
      { status: profileStatus >= 400 ? profileStatus : 502, headers: noStoreHeaders }
    );
  }

  const response = NextResponse.json({ user }, { headers: noStoreHeaders });
  setSessionCookies(response, request, session.sessionId, session.expiresInSeconds);
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token)
    return NextResponse.json(
      { detail: 'Session not found' },
      { status: 401, headers: noStoreHeaders }
    );

  let profile: Response;
  try {
    profile = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/current`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json(
      { detail: 'Session service unavailable' },
      { status: 502, headers: noStoreHeaders }
    );
  }

  if (profile.status === 401 || profile.status === 404) {
    const response = NextResponse.json(
      { detail: 'Session expired' },
      { status: 401, headers: noStoreHeaders }
    );
    clearSessionCookies(response);
    return response;
  }
  if (!profile.ok) {
    return NextResponse.json(
      { detail: 'Session service unavailable' },
      { status: 502, headers: noStoreHeaders }
    );
  }

  const detail = (await profile.json()) as { user?: User | null };
  if (!detail.user) {
    return NextResponse.json(
      { detail: 'Session profile unavailable' },
      { status: 502, headers: noStoreHeaders }
    );
  }
  const response = NextResponse.json({ user: detail.user }, { headers: noStoreHeaders });
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
      const result = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/current`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      revoked = result.ok;
    } catch {
      revoked = false;
    }
  }
  const response = new NextResponse(null, {
    status: revoked ? 204 : 502,
    headers: noStoreHeaders,
  });
  clearSessionCookies(response);
  return response;
}
