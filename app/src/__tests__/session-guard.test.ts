import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
