import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <SearchX className="size-10 text-muted-foreground" strokeWidth={1.5} />
      <p className="mt-6 font-mono text-sm text-muted-foreground">ERROR 404</p>
      <h1 className="mt-2 text-3xl font-semibold">This page is out of bounds.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        The address may be incorrect, or the page may have moved. Head back to the contest calendar.
      </p>
      <Link href="/contests" className={buttonVariants({ className: 'mt-7' })}>
        <ArrowLeft /> Return to contests
      </Link>
    </main>
  );
}
