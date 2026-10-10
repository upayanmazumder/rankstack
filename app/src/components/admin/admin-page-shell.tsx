import type { ReactNode } from 'react';

interface AdminPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AdminPageShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: AdminPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
