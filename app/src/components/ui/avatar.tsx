'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type AvatarContextValue = {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  setStatus: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
};

const AvatarContext = React.createContext<AvatarContextValue>({
  status: 'idle',
  setStatus: () => {},
});

function Avatar({ className, ...props }: React.ComponentProps<'span'>) {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <span
        data-slot="avatar"
        className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', className)}
        {...props}
      />
    </AvatarContext.Provider>
  );
}

function AvatarImage({
  className,
  alt,
  onLoad,
  onError,
  ...props
}: React.ComponentProps<'img'> & { alt: string }) {
  const { setStatus } = React.useContext(AvatarContext);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-slot="avatar-image"
      alt={alt}
      className={cn('aspect-square size-full object-cover', className)}
      onLoad={e => {
        setStatus('loaded');
        onLoad?.(e);
      }}
      onError={e => {
        setStatus('error');
        onError?.(e);
      }}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<'span'>) {
  const { status } = React.useContext(AvatarContext);

  if (status === 'loaded') {
    return null;
  }

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium',
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
