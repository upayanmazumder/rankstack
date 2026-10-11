import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET as proxyGet, POST as proxyPost } from '@/app/api/proxy/[...path]/route';
import { POST as loginPost } from '@/app/api/session/route';
import { proxy } from '@/proxy';

const endpoint = 'http://localhost:3000';

afterEach(() => vi.unstubAllGlobals());

describe('protected route guard', () => {
  it('rejects a forged session cookie after server verification fails', async () => {
    const verify = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', verify);
    const request = new NextRequest(`${endpoint}/admin/users?tab=active`, {
      headers: { cookie: 'rankstack-session=forged' },
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      `${endpoint}/login?from=%2Fadmin%2Fusers%3Ftab%3Dactive`
    );
    expect(response.cookies.get('rankstack-session')?.value).toBe('');
    expect(verify).toHaveBeenCalledOnce();
  });

  it('allows guests to browse the public contest catalog', async () => {
    const verify = vi.fn();
    vi.stubGlobal('fetch', verify);
    const request = new NextRequest(`${endpoint}/contests`);

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(verify).not.toHaveBeenCalled();
  });

  it('allows a protected route only when the backend verifies the session', async () => {
    const verify = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', verify);
    const request = new NextRequest(`${endpoint}/admin`, {
      headers: { cookie: 'rankstack-session=valid-token' },
    });

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(verify).toHaveBeenCalledWith(expect.stringContaining('/sessions/valid-token'), {
      cache: 'no-store',
    });
  });
});

describe('session route and API proxy', () => {
  it('returns an error and avoids setting the session cookie when profile lookup fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ sessionId: 'sess-1', userId: 'u1', expiresInSeconds: 3600 }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(new Response('Upstream error', { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest(`${endpoint}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'secret' }),
    });

    const response = await loginPost(request);

    expect(response.status).toBe(500);
    expect(response.cookies.get('rankstack-session')).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('sets the HttpOnly session cookie and omits sessionId from the login response body', async () => {
    const user = {
      id: 'u1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'participant',
      totalScore: 0,
      teamIds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ sessionId: 'sess-1', userId: 'u1', expiresInSeconds: 3600 }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: 'sess-1', user }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest(`${endpoint}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'secret' }),
    });

    const response = await loginPost(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ user });
    expect(body).not.toHaveProperty('session');
    expect(response.cookies.get('rankstack-session')?.value).toBe('sess-1');
  });

  it('forwards the rankstack-session cookie as a Bearer token through the server API proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'sub-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest(`${endpoint}/api/proxy/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'rankstack-session=secret-session-token',
      },
      body: JSON.stringify({ contestId: 'c1', problemId: 'p1', answer: 'A' }),
    });

    const response = await proxyPost(request, {
      params: Promise.resolve({ path: ['submissions'] }),
    });

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/submissions');
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer secret-session-token');
  });

  it('returns 401 from the proxy without mutating the rankstack-session cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Invalid or expired session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest(`${endpoint}/api/proxy/teams`, {
      headers: { cookie: 'rankstack-session=expired-token' },
    });

    const response = await proxyGet(request, {
      params: Promise.resolve({ path: ['teams'] }),
    });

    expect(response.status).toBe(401);
    expect(response.cookies.get('rankstack-session')).toBeUndefined();
  });

  it('returns a structured 502 JSON response when the upstream fetch fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest(`${endpoint}/api/proxy/contests`);
    const response = await proxyGet(request, {
      params: Promise.resolve({ path: ['contests'] }),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ message: 'Upstream API unavailable' });
  });
});
