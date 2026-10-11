import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar, AvatarFallback, AvatarImage } from '../avatar';

describe('Avatar', () => {
  it('hides the fallback while the image is loading', () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );

    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('shows the fallback only after the image fails to load', () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );

    fireEvent.error(screen.getByRole('img', { name: 'Ada Lovelace' }));

    expect(screen.getByText('AL')).toBeInTheDocument();
  });
});
