'use client';

import { createPortal } from 'react-dom';

import { BrandMark } from '@/components/layout/brand-mark';
import LatticeLoader from '@/components/react-bits/lattice-loader';
import { useMounted } from '@/hooks/use-mounted';
import { usePalette } from '@/hooks/use-palette';
import { cn } from '@/lib/utils';

interface LoaderProps {
  /** What the app is doing, in sentence case. Screen readers announce it. */
  label: string;
}

function Lattice({ label }: LoaderProps) {
  const palette = usePalette();
  return (
    <LatticeLoader
      label={label}
      pattern="sweep"
      grid={3}
      cellSize={7}
      gap={3}
      fontSize={14}
      color={palette.accent}
      glow={palette.mode === 'dark'}
      showTimer={false}
      className="text-muted-foreground"
    />
  );
}

// Both loaders fade in after a short delay, so fast loads never flash them.
const DELAYED_FADE = 'motion-safe:animate-delayed-fade';

/**
 * Covers the whole screen while the app moves the user between auth states
 * (signing in, signing out, checking admin access). After mount it renders
 * into `document.body`, so transformed or blurred ancestors cannot trap it.
 */
export function FullScreenLoader({ label }: LoaderProps) {
  const mounted = useMounted();
  const overlay = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background',
        DELAYED_FADE
      )}
    >
      <BrandMark className="size-8" />
      <Lattice label={label} />
    </div>
  );
  return mounted ? createPortal(overlay, document.body) : overlay;
}

/** Fills the content area while a route segment loads. Header and footer stay. */
export function PageLoader({ label }: LoaderProps) {
  return (
    <div className={cn('flex flex-1 items-center justify-center py-24', DELAYED_FADE)}>
      <Lattice label={label} />
    </div>
  );
}
