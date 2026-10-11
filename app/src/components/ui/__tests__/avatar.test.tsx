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

  it('resets fallback visibility when src changes after an error and shows fallback when src is empty', () => {
    const { rerender } = render(
      <Avatar>
        <AvatarImage src="/broken.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );

    fireEvent.error(screen.getByRole('img', { name: 'Ada Lovelace' }));
    expect(screen.getByText('AL')).toBeInTheDocument();

    rerender(
      <Avatar>
        <AvatarImage src="/recovered.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );
    expect(screen.queryByText('AL')).not.toBeInTheDocument();

    fireEvent.load(screen.getByRole('img', { name: 'Ada Lovelace' }));
    expect(screen.queryByText('AL')).not.toBeInTheDocument();

    rerender(
      <Avatar>
        <AvatarImage src="" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
  });
});
