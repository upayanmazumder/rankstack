'use client';

import type { ReactNode } from 'react';
import { domMax, LazyMotion, MotionConfig } from 'framer-motion';

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
