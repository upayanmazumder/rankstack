'use client';

import { useReducedMotion } from 'framer-motion';

import TextType from '@/components/react-bits/text-type';
import { useMounted } from '@/hooks/use-mounted';
import { cn } from '@/lib/utils';

interface HeroHeadlineProps {
  text: string;
  className?: string;
}

/**
 * Headline typed out once, like a line in a code editor. An invisible copy
 * reserves the final size so the layout does not move while it types.
 */
export function HeroHeadline({ text, className }: HeroHeadlineProps) {
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();

  return (
    <h1 className={cn('relative', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      {mounted && !reduceMotion ? (
        <TextType
          aria-hidden="true"
          as="span"
          text={text}
          loop={false}
          typingSpeed={45}
          initialDelay={250}
          cursorCharacter="_"
          cursorClassName="text-primary"
          className="absolute inset-0"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0">
          {text}
        </span>
      )}
    </h1>
  );
}
