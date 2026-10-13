'use client';

import { useReducedMotion } from 'framer-motion';

import Counter from '@/components/react-bits/counter';

interface ScoreCounterProps {
  score: number;
  /** Digit height in pixels. */
  size: number;
}

/**
 * Score shown on rolling scoreboard digits. When a poll changes the score,
 * the digits roll to the new value. Screen readers get the plain number.
 */
export function ScoreCounter({ score, size }: ScoreCounterProps) {
  const reduceMotion = useReducedMotion();
  const value = Math.max(0, Math.round(score));

  if (reduceMotion || value !== score) {
    return <span className="tabular-nums">{score.toLocaleString()}</span>;
  }

  return (
    <>
      <span className="sr-only">{score.toLocaleString()}</span>
      <span aria-hidden="true">
        <Counter
          value={value}
          fontSize={size}
          gap={0}
          horizontalPadding={0}
          borderRadius={0}
          gradientHeight={0}
          fontWeight="inherit"
          containerStyle={{ verticalAlign: 'middle' }}
          counterStyle={{ fontVariantNumeric: 'tabular-nums' }}
        />
      </span>
    </>
  );
}
