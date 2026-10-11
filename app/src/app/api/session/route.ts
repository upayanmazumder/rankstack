import { NextResponse, type NextRequest } from 'next/server';

import { env } from '@/env';
import type { Session, User } from '@/types';

const cookieName = 'rankstack-session';

export async function POST(request: NextRequest) {
  const credentials = await request.text();
  const login = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: credentials,
    cache: 'no-store',
  });
  if (!login.ok) {
    return new NextResponse(await login.text(), {
      status: login.status,
      headers: { 'Content-Type': 'application/json' },
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
  response.cookies.set(cookieName, session.sessionId, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: session.expiresInSeconds,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
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
  response.cookies.delete(cookieName);
  return response;
}
