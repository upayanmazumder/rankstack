'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Moon, Sun, Trophy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

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
import { useMounted } from '@/hooks/use-mounted';
import { useAuthStore, useUiStore } from '@/stores';

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

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const mounted = useMounted();
  const activeTheme = mounted ? (theme ?? 'system') : 'system';
  const toggleSidebar = useUiStore(state => state.toggleSidebar);
  const user = useAuthStore(state => state.user);
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onError: () =>
        toast.error('The server could not revoke this session. Local sign-out completed.'),
      onSettled: () => router.replace('/login'),
    });
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-sm">
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
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Trophy className="size-5 text-primary" />
        <span className="hidden sm:inline">Rankstack</span>
      </Link>

      {/* Desktop nav */}
      <nav className="ml-6 hidden items-center gap-1 md:flex">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        ))}
        {user?.role === 'admin' && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
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
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${activeTheme}. Change theme`}
          title={`Theme: ${activeTheme}`}
          onClick={() =>
            setTheme(
              activeTheme === 'system' ? 'light' : activeTheme === 'light' ? 'dark' : 'system'
            )
          }
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>

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
  );
}
