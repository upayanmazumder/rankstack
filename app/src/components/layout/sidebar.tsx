'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, ListOrdered, Shield, Trophy, Users } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore, useUiStore } from '@/stores';

const MAIN_LINKS = [
  { href: '/contests', label: 'Contests', icon: Trophy },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/submissions', label: 'Submissions', icon: ListOrdered },
] as const;

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/contests', label: 'Manage Contests', icon: Trophy },
  { href: '/admin/problems', label: 'Manage Problems', icon: FileText },
  { href: '/admin/submissions', label: 'Review Submissions', icon: ListOrdered },
  { href: '/admin/users', label: 'Manage Users', icon: Shield },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUiStore.use.sidebarOpen();
  const setSidebarOpen = useUiStore.use.setSidebarOpen();
  const user = useAuthStore.use.user();

  return (
    <Sheet open={sidebarOpen} onOpenChange={open => setSidebarOpen(open)}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-primary" />
            Rankstack
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-3">
          {MAIN_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}

          {user?.role === 'admin' && (
            <>
              <Separator className="my-2" />
              <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Admin
              </p>
              {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
