'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedInput } from '@/components/ui/animated-input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useClientLogin } from '@/hooks/client/useClientAuth';
import { useClientStore } from '@/store/useClientStore';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
} as const;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/perfil';
  const { isAuthenticated, _hasHydrated } = useClientStore();
  const loginMutation = useClientLogin(redirectTo);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [_hasHydrated, isAuthenticated, router, redirectTo]);

  const onSubmit = async (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Show loading while checking auth or redirecting
  if (!_hasHydrated || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header simple */}
      <header className="sticky top-0 z-50 h-14 bg-background/95 backdrop-blur border-b">
        <div className="container h-full flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="h-10 w-10 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center pr-10">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                Q
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <motion.div variants={itemVariants}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">
                  Q
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardTitle className="text-2xl">Bienvenido de vuelta</CardTitle>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardDescription>
                  Ingresa para ver tus pedidos y más
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div variants={itemVariants}>
                  <AnimatedInput
                    id="email"
                    type="email"
                    label="Email"
                    inputMode="email"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <AnimatedInput
                    id="password"
                    type="password"
                    label="Contraseña"
                    autoComplete="current-password"
                    showPasswordToggle
                    error={errors.password?.message}
                    {...register('password')}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="text-right">
                  <Link
                    href="/recuperar-contrasena"
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <AnimatedButton
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    loading={loginMutation.isPending}
                    loadingText="Iniciando sesión..."
                    showShine
                  >
                    Iniciar sesión
                  </AnimatedButton>
                </motion.div>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-0">
              <motion.div variants={itemVariants} className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    ¿No tienes cuenta?
                  </span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="w-full">
                <Button variant="outline" className="w-full h-12" asChild>
                  <Link href="/registro">Crear cuenta</Link>
                </Button>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Volver a la tienda
                </Link>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
