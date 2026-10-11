import { NextResponse, type NextRequest } from 'next/server';

import { env } from '@/env';

const SESSION_COOKIE_NAME = 'rankstack-session';

interface ProxyRouteContext {
  params: Promise<{ path: string[] }>;
}

async function forwardToBackend(request: NextRequest, context: ProxyRouteContext) {
  const { path } = await context.params;
  const encodedPath = path.map(segment => encodeURIComponent(segment)).join('/');
  const targetUrl = `${env.NEXT_PUBLIC_API_URL}/${encodedPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const accept = request.headers.get('accept');
  if (accept) headers.set('Accept', accept);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const rawBody = hasBody ? await request.text() : '';

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody && rawBody.length > 0 ? rawBody : undefined,
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get('content-type');
  if (upstreamContentType) {
    responseHeaders.set('Content-Type', upstreamContentType);
  }

  const response =
    upstream.status === 204
      ? new NextResponse(null, { status: 204, headers: responseHeaders })
      : new NextResponse(await upstream.text(), {
          status: upstream.status,
          headers: responseHeaders,
        });

  if (upstream.status === 401 && token) {
    response.cookies.delete(SESSION_COOKIE_NAME);
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

export async function PUT(request: NextRequest, context: ProxyRouteContext) {
  return forwardToBackend(request, context);
}

export async function DELETE(request: NextRequest, context: ProxyRouteContext) {
  return forwardToBackend(request, context);
}
