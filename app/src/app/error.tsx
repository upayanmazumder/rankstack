'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface AppErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function Error({ error, retry }: AppErrorProps) {
  useEffect(() => {
    console.error('Application route error', { error, digest: error.digest });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <AlertTriangle className="size-10 text-destructive" strokeWidth={1.5} />
      <h1 className="mt-6 text-3xl font-semibold">Something went wrong.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        The page hit an unexpected error. Try loading it again.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <Button className="mt-7" onClick={retry}>
        <RefreshCw /> Try again
      </Button>
    </main>
  );
}
