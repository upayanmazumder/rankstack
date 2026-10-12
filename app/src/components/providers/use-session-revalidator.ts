import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { SESSION_EXPIRED_EVENT, SESSION_REFRESH_INTERVAL_MS } from '@/constants/session';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types';

// Polls the session cookie on an interval and keeps the auth store in sync:
// refreshes the profile for a valid cookie, clears auth on an expired one,
// and ignores transient failures so a flaky network never logs a user out.
export function useSessionRevalidator() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    async function refreshSession() {
      const generation = useAuthStore.getState().sessionGeneration;
      try {
        const response = await fetch('/api/session', { cache: 'no-store' });
        if (!mounted || generation !== useAuthStore.getState().sessionGeneration) return;

        if (response.status === 401) {
          if (useAuthStore.getState().user) {
            useAuthStore.getState().clearAuth();
            queryClient.clear();
            window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
          }
          return;
        }
        if (!response.ok) return;

        const profile = (await response.json()) as { user?: User };
        if (
          mounted &&
          generation === useAuthStore.getState().sessionGeneration &&
          profile.user &&
          !useAuthStore.getState().signedOut
        ) {
          useAuthStore.getState().setAuth(profile.user);
        }
      } catch {
        // A transient network failure does not invalidate a browser session.
      }
    }

    void refreshSession();
    const interval = window.setInterval(() => void refreshSession(), SESSION_REFRESH_INTERVAL_MS);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [queryClient]);
}
