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
import { useLogin, useRegister } from '@/hooks/api';
import { useZodForm } from '@/hooks/use-zod-form';
import { useAuthStore } from '@/stores';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore.use.setAuth();
  const register = useRegister();
  const login = useLogin();

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(registerSchema);

  async function onSubmit({ name, email, password }: RegisterValues) {
    try {
      await register.mutateAsync({ name, email, password });
      const session = await login.mutateAsync({ email, password });

      const userRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/users/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.sessionId}` },
      });
      if (!userRes.ok) throw new Error('Failed to load user profile');
      const user = await userRes.json();

      setAuth(session.sessionId, user);
      toast.success('Account created! Welcome to Rankstack.');
      router.push('/contests');
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        toast.error('An account with that email already exists.');
      } else {
        toast.error(isApiError(err) ? err.message : 'Registration failed. Please try again.');
      }
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-2 flex justify-center">
          <Trophy className="size-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>Join Rankstack and start competing</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              aria-invalid={!!errors.name}
              {...field('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...field('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...field('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
