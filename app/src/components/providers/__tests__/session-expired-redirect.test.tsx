import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_EXPIRED_EVENT } from '@/constants/session';

import { SessionExpiredRedirect } from '../session-expired-redirect';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

describe('SessionExpiredRedirect', () => {
  beforeEach(() => replace.mockReset());

  it('routes the browser to login when the API reports an expired session', () => {
    render(<SessionExpiredRedirect />);

    act(() => window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)));

    expect(replace).toHaveBeenCalledWith('/login');
  });
});
