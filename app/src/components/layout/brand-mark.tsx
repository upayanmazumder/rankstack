import { cn } from '@/lib/utils';

/** Three ranked bars: the leader's bar is longest and carries the brand color. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={cn('size-5', className)}>
      <rect x="2" y="3" width="16" height="3.5" rx="1" className="fill-brand" />
      <rect x="2" y="8.25" width="12" height="3.5" rx="1" className="fill-current" />
      <rect x="2" y="13.5" width="8" height="3.5" rx="1" className="fill-current opacity-45" />
    </svg>
  );
}
