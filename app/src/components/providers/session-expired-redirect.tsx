'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { SESSION_EXPIRED_EVENT } from '@/constants/session';

export function SessionExpiredRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirectToLogin = () => router.replace('/login');
    window.addEventListener(SESSION_EXPIRED_EVENT, redirectToLogin);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, redirectToLogin);
  }, [router]);

  return null;
}
