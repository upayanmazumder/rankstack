import Link from 'next/link';

import { BrandMark } from '@/components/layout/brand-mark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-full flex-1 flex-col px-4 py-6 sm:px-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-2 rounded-sm font-display text-lg font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <BrandMark />
        Rankstack
      </Link>
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
