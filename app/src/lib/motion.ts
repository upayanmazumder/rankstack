import type { Easing, Variants } from 'framer-motion';

type Bezier = [number, number, number, number];

export const EASE = {
  out: [0.16, 1, 0.3, 1] as Bezier,
  inOut: [0.65, 0, 0.35, 1] as Bezier,
} satisfies Record<string, Easing>;

export const DURATION = {
  fast: 0.2,
  base: 0.4,
  slow: 0.6,
} as const;

export function staggerContainer(stagger = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
};
