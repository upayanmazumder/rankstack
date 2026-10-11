import type { NextRequest, NextResponse } from 'next/server';

import { SESSION_REFRESH_INTERVAL_MS } from '@/constants/session';

export const SESSION_COOKIE_NAME = 'rankstack-session';
const SESSION_METADATA_COOKIE_NAME = 'rankstack-session-window';
const DEFAULT_SESSION_TTL_SECONDS = 3_600;

interface SessionWindow {
  ttlSeconds: number;
  refreshedAt: number;
}

function readSessionWindow(request: NextRequest): SessionWindow | null {
  const value = request.cookies.get(SESSION_METADATA_COOKIE_NAME)?.value;
  if (!value) return null;
  const [ttlValue, refreshedValue] = value.split('.');
  const ttlSeconds = Number(ttlValue);
  const refreshedAt = Number(refreshedValue);
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 1 || !Number.isSafeInteger(refreshedAt)) {
    return null;
  }
  return { ttlSeconds, refreshedAt };
}

export function sessionNeedsRefresh(request: NextRequest, now = Date.now()): boolean {
  const window = readSessionWindow(request);
  return (
    !window || now < window.refreshedAt || now - window.refreshedAt >= SESSION_REFRESH_INTERVAL_MS
  );
}

export function sessionTtlSeconds(request: NextRequest): number {
  return readSessionWindow(request)?.ttlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
}

export function setSessionCookies(
  response: NextResponse,
  request: NextRequest,
  token: string,
  ttlSeconds: number,
  now = Date.now()
): void {
  const options = {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ttlSeconds,
  };
  response.cookies.set(SESSION_COOKIE_NAME, token, options);
  response.cookies.set(SESSION_METADATA_COOKIE_NAME, `${ttlSeconds}.${now}`, options);
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(SESSION_METADATA_COOKIE_NAME);
}
