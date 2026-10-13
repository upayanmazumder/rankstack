'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { FullScreenLoader } from '@/components/common/loaders';
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
    return <FullScreenLoader label="Checking administrator access" />;
  }

  return children;
}
