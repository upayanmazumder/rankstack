import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '../login/page';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  replace: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock('@/hooks/api', () => ({ useLogin: () => ({ mutateAsync: mocks.mutateAsync }) }));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({});
    window.history.replaceState({}, '', '/login?from=%2Fsubmissions');
  });

  it('shows validation errors without submitting invalid credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('submits valid credentials and returns to the requested page', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'secret123',
      })
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Welcome back!');
    expect(mocks.replace).toHaveBeenCalledWith('/submissions');
  });

  it('shows an error toast when authentication fails', async () => {
    mocks.mutateAsync.mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith('Sign in failed. Please try again.')
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
