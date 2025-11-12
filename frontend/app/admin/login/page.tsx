'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, LogIn, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setIsLoading(true);

    try {
      await login(data.email, data.password);

      // Check if user is admin
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role !== 'admin') {
        setError('Acceso denegado. Solo los administradores pueden acceder.');
        await useAuthStore.getState().logout();
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setIsLoading(false);

      // Handle different error types
      if (err?.status === 401) {
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
      } else if (err?.status === 423) {
        setError(err.message || 'Cuenta bloqueada temporalmente por múltiples intentos fallidos.');
      } else if (err?.status === 403) {
        setError('Cuenta desactivada. Por favor, contacta a soporte.');
      } else if (err?.status === 429) {
        setError('Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.');
      } else {
        setError(err?.message || 'Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          {/* Logo/Brand */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Lock className="h-8 w-8" />
          </div>

          <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al panel
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@confiteriaquelita.com"
                  className="pl-9"
                  disabled={isLoading}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  disabled={isLoading}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>¿Olvidaste tu contraseña?</p>
            <p className="mt-1">Contacta al administrador principal</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
