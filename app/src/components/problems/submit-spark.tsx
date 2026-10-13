'use client';

import type { ReactNode } from 'react';

import ClickSpark from '@/components/react-bits/click-spark';
import { usePalette } from '@/hooks/use-palette';

interface SubmitSparkProps {
  children: ReactNode;
  disabled?: boolean;
}

/** Accent sparks burst from the pointer when the wrapped control is clicked. */
export function SubmitSpark({ children, disabled = false }: SubmitSparkProps) {
  const palette = usePalette();
  return (
    <ClickSpark
      sparkColor={palette.accent}
      sparkCount={10}
      sparkRadius={28}
      sparkSize={9}
      duration={450}
      disabled={disabled}
      style={{ display: 'inline-block', width: 'auto', height: 'auto' }}
    >
      {children}
    </ClickSpark>
  );
}
