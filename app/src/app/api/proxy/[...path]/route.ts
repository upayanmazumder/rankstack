import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_REFRESH_FETCH_TIMEOUT_MS } from '@/constants/session';
import { env } from '@/env';
import {
  SESSION_COOKIE_NAME,
  sessionNeedsRefresh,
  sessionTtlSeconds,
  setSessionCookies,
} from '@/lib/session-cookie';

interface ProxyRouteContext {
  params: Promise<{ path: string[] }>;
}

async function forwardToBackend(request: NextRequest, context: ProxyRouteContext) {
  const { path } = await context.params;
  const encodedPath = path.map(segment => encodeURIComponent(segment)).join('/');
  const targetUrl = `${env.NEXT_PUBLIC_API_URL}/${encodedPath}${request.nextUrl.search}`;
  const publicContestRead =
    request.method === 'GET' &&
    path[0] === 'contests' &&
    (path.length === 2 || (path.length === 3 && path[2] === 'leaderboard'));

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const accept = request.headers.get('accept');
  if (accept) headers.set('Accept', accept);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token && !publicContestRead) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const rawBody = hasBody ? await request.text() : '';

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody && rawBody.length > 0 ? rawBody : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ detail: 'Upstream API unavailable' }, { status: 502 });
  }

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get('content-type');
  if (upstreamContentType) {
    responseHeaders.set('Content-Type', upstreamContentType);
  }
  if (publicContestRead && upstream.ok) {
    responseHeaders.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10');
  }

  const isNullBodyStatus =
    upstream.status === 204 || upstream.status === 205 || upstream.status === 304;

  const response = isNullBodyStatus
    ? new NextResponse(null, { status: upstream.status, headers: responseHeaders })
    : new NextResponse(await upstream.text(), {
        status: upstream.status,
        headers: responseHeaders,
      });

  if (token && !publicContestRead && upstream.ok && sessionNeedsRefresh(request)) {
    try {
      const session = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions/current`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(SESSION_REFRESH_FETCH_TIMEOUT_MS),
      });
      if (session.status === 200) {
        setSessionCookies(response, request, token, sessionTtlSeconds(request));
      }
    } catch {
      // Preserve the upstream result if session refresh is temporarily unavailable or times out.
    }
  }

  return response;
}

export async function GET(request: NextRequest, context: ProxyRouteContext) {
  return forwardToBackend(request, context);
}

export async function POST(request: NextRequest, context: ProxyRouteContext) {
  return forwardToBackend(request, context);
}

export async function PATCH(request: NextRequest, context: ProxyRouteContext) {
  return forwardToBackend(request, context);
}

export async function DELETE(request: NextRequest, context: ProxyRouteContext) {
  return forwardToBackend(request, context);
}
