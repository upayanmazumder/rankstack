import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const STATE_DOT =
  "border-border bg-transparent before:size-1.5 before:shrink-0 before:rounded-full before:content-['']";

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        // State variants stay neutral. Only a small dot carries the state color.
        destructive: `${STATE_DOT} text-foreground before:bg-destructive`,
        success: `${STATE_DOT} text-foreground before:bg-success`,
        warning: `${STATE_DOT} text-foreground before:bg-warning`,
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
