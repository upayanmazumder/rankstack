'use client';

import type { ReactNode } from 'react';
import { m, useReducedMotion } from 'framer-motion';

import { DURATION, EASE, pageVariants } from '@/lib/motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      variants={pageVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate="enter"
      transition={{ duration: DURATION.fast, ease: EASE.out }}
    >
      {children}
    </m.div>
  );
}
