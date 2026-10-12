import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// base-ui render-prop components accept `className` as either a plain
// string or a `(state) => string` function. Merge a component's static
// Tailwind classes with whichever form the caller passed in.
export function mergeClassName<T>(
  className: string | ((state: T) => string | undefined) | undefined,
  staticClassName: string
) {
  if (typeof className === 'function') {
    return (state: T) => cn(staticClassName, className(state));
  }
  return cn(staticClassName, className);
}
