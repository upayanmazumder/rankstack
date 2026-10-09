import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUiStore } from '@/stores/ui-store';

import { Sidebar } from '../sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/contests' }));

describe('mobile sidebar keyboard access', () => {
  afterEach(() => useUiStore.getState().setSidebarOpen(false));

  it('moves focus inside the drawer and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    act(() => useUiStore.getState().setSidebarOpen(true));
    const dialog = await screen.findByRole('dialog', { name: 'Rankstack' });
    const contests = screen.getByRole('link', { name: 'Contests' });
    await waitFor(() => expect(contests).toHaveFocus());

    await user.tab();
    expect(screen.getByRole('link', { name: 'Teams' })).toHaveFocus();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard('{Escape}');
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });
});
