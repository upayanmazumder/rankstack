import * as React from 'react';
import { Field as FieldPrimitive } from '@base-ui/react/field';

import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Label>) {
  return (
    <FieldPrimitive.Label
      className={cn(
        'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
}

export { Label };
