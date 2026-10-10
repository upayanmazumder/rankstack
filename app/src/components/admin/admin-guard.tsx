'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

import { useMounted } from '@/hooks/use-mounted';
import { useAuthStore } from '@/stores';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const mounted = useMounted();
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (mounted && user?.role !== 'admin') router.replace('/contests');
  }, [mounted, router, user?.role]);

  if (!mounted || user?.role !== 'admin') {
    return (
      <div
        role="status"
        className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-muted-foreground"
      >
        <ShieldCheck className="size-5 animate-pulse text-primary" />
        Verifying administrator access…
      </div>
    );
  }

  return children;
}
