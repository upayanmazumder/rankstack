'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { isApiError } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { env } from '@/env';
import { useLogin } from '@/hooks/api';
import { useZodForm } from '@/hooks/use-zod-form';
import { useAuthStore } from '@/stores';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore.use.setAuth();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(loginSchema);

  async function onSubmit({ email, password }: LoginValues) {
    try {
      const session = await login.mutateAsync({ email, password });

      const userRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/users/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.sessionId}` },
      });
      if (!userRes.ok) throw new Error('Failed to load user profile');
      const user = await userRes.json();

      setAuth(session.sessionId, user);
      toast.success('Welcome back!');
      router.push('/contests');
    } catch (err) {
      toast.error(isApiError(err) ? err.message : 'Sign in failed. Please try again.');
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-2 flex justify-center">
          <Trophy className="size-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access Rankstack</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
