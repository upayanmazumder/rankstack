'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { toast } from 'sonner';

import { FullScreenLoader } from '@/components/common/loaders';
import { BrandMark } from '@/components/layout/brand-mark';
import { ThemeSwitch } from '@/components/layout/theme-switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/hooks/api';
import { useHydratedUser } from '@/hooks/use-hydrated-user';
import { useUiStore } from '@/stores';

const NAV_LINKS = [
  { href: '/contests', label: 'Contests' },
  { href: '/teams', label: 'Teams' },
  { href: '/submissions', label: 'Submissions' },
] as const;

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/contests', label: 'Manage Contests' },
  { href: '/admin/problems', label: 'Manage Problems' },
  { href: '/admin/submissions', label: 'Review Submissions' },
  { href: '/admin/users', label: 'Manage Users' },
] as const;

const NAV_ITEM =
  '-mb-px flex items-center border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset';
const NAV_ITEM_ACTIVE = 'border-primary text-foreground';
const NAV_ITEM_IDLE = 'border-transparent text-muted-foreground hover:text-foreground';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const toggleSidebar = useUiStore(state => state.toggleSidebar);
  const user = useHydratedUser();
  const logout = useLogout();

  const [signingOut, setSigningOut] = useState(false);

  function handleLogout() {
    setSigningOut(true);
    logout.mutate(undefined, {
      onError: () =>
        toast.error('The server could not revoke this session. Local sign-out completed.'),
      onSettled: () => router.replace('/login'),
    });
  }

  return (
    <>
      {signingOut && <FullScreenLoader label="Signing you out" />}
      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/85 px-4 backdrop-blur-sm sm:px-6">
        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          aria-label="Toggle navigation"
          onClick={toggleSidebar}
        >
          <Menu />
        </Button>

        {/* Brand */}
        <Link
          href="/"
          aria-label="Rankstack home"
          className="flex items-center gap-2 rounded-sm font-display text-lg font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <BrandMark />
          <span className="hidden sm:inline">Rankstack</span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-8 hidden self-stretch md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? 'page' : undefined}
              className={`${NAV_ITEM} ${pathname.startsWith(href) ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`}
            >
              {label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`${NAV_ITEM} ${
                  pathname.startsWith('/admin') ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE
                }`}
              >
                Admin
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {ADMIN_LINKS.map(({ href, label }) => (
                  <DropdownMenuItem key={href} onClick={() => router.push(href)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitch />

          {/* Auth controls */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="size-8 cursor-pointer">
                  <AvatarFallback className="text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              Sign in
            </Link>
          )}
        </div>
      </header>
    </>
  );
}
