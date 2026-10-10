'use client';

import { m, useReducedMotion } from 'framer-motion';

import { staggerContainer, staggerItemVariants } from '@/lib/motion';

import { resolveTransition, resolveTrigger, type MotionWrapperProps } from './shared';

interface StaggerProps extends Omit<MotionWrapperProps, 'delay' | 'duration'> {
  stagger?: number;
  delayChildren?: number;
}

export function Stagger({
  children,
  stagger = 0.08,
  delayChildren = 0,
  inView = false,
  once = true,
  ...props
}: StaggerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      variants={staggerContainer(stagger, delayChildren)}
      {...(reduceMotion ? { initial: false, animate: 'visible' } : resolveTrigger(inView, once))}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  delay,
  duration,
  ...props
}: Omit<MotionWrapperProps, 'inView' | 'once'>) {
  return (
    <m.div
      variants={staggerItemVariants}
      transition={resolveTransition(delay, duration)}
      {...props}
    >
      {children}
    </m.div>
  );
}
