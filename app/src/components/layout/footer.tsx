import Link from 'next/link';

import { BrandMark } from '@/components/layout/brand-mark';
import { env } from '@/env';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <BrandMark className="size-4" />
          &copy; {new Date().getFullYear()} Rankstack
        </p>
        <Link
          href={`${env.NEXT_PUBLIC_API_URL}/docs`}
          className="rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          target="_blank"
          rel="noopener noreferrer"
        >
          API documentation
        </Link>
      </div>
    </footer>
  );
}
