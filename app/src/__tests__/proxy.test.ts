// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

import { proxy } from '../proxy';

vi.mock('@/env', () => ({ env: { NEXT_PUBLIC_API_URL: 'http://api.test' } }));

function request(path: string, token?: string) {
  const req = new NextRequest(`http://app.test${path}`);
  if (token) req.cookies.set(SESSION_COOKIE_NAME, token);
  return req;
}

function apiAnswers(status: number) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe('proxy', () => {
  it('sends a signed-in user from the login and register pages to the contests page', async () => {
    apiAnswers(200);
    for (const path of ['/login', '/register?from=/teams']) {
      const response = await proxy(request(path, 'token'));
      expect(response.headers.get('location')).toBe('http://app.test/contests');
    }
  });

  it('shows the login page to a visitor without a valid session', async () => {
    expect((await proxy(request('/login'))).headers.get('location')).toBeNull();

    apiAnswers(401);
    expect((await proxy(request('/login', 'expired'))).headers.get('location')).toBeNull();
  });

  it('keeps the login page open when the API cannot confirm the session', async () => {
    apiAnswers(503);
    expect((await proxy(request('/login', 'token'))).headers.get('location')).toBeNull();
  });

  it('sends a visitor without a session from a protected page to login', async () => {
    const response = await proxy(request('/teams/42?tab=roster'));
    expect(response.headers.get('location')).toBe(
      'http://app.test/login?from=%2Fteams%2F42%3Ftab%3Droster'
    );
  });

  it('lets a signed-in user open a protected page', async () => {
    apiAnswers(200);
    expect((await proxy(request('/admin', 'token'))).headers.get('location')).toBeNull();
  });
});
