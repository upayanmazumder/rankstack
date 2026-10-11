import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterPage from '../page';

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  push: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/hooks/api', () => ({
  useRegister: () => ({ mutateAsync: mocks.register }),
  useLogin: () => ({ mutateAsync: mocks.login }),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error, info: mocks.info },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach(mock => mock.mockReset());
  });

  it('does not label a successful registration as failed when automatic login fails', async () => {
    mocks.register.mockResolvedValue({ id: 'u1' });
    mocks.login.mockRejectedValue(new Error('Session service unavailable'));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/login'));
    expect(mocks.register).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret123',
    });
    expect(mocks.login).toHaveBeenCalledOnce();
    expect(mocks.info).toHaveBeenCalledWith('Account created. Sign in to continue.');
    expect(mocks.error).not.toHaveBeenCalled();
  });
});
