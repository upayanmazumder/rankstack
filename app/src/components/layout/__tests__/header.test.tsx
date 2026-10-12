import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth-store';

import { Header } from '../header';

const push = vi.fn();
const replace = vi.fn();

vi.mock('@/hooks/api', () => ({
  useLogout: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/use-mounted', () => ({
  useMounted: () => false,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/contests',
  useRouter: () => ({ push, replace }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

describe('Header hydration', () => {
  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders signed-out on the first client pass when a persisted user is present', () => {
    const user = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'admin' as const,
      totalScore: 120,
      teamIds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    useAuthStore.setState({ user });

    render(<Header />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });
});
