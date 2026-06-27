'use client';

import { useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
  const errorFlag = searchParams.get('error');
  const { isAuthenticated, user, _hasHydrated } = useClientStore();
  const loginMutation = useClientLogin(redirectTo);

  // Token must exist AND user must be loaded to consider auth real.
  // Prevents redirect loops with stale persisted `isAuthenticated=true` after token expiry.
  const hasToken =
    typeof window !== 'undefined' && !!localStorage.getItem('client-token');
  const isReallyAuth = isAuthenticated && !!user && hasToken;

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

  // Redirigir si ya está autenticado (token + user válidos)
  useEffect(() => {
    if (_hasHydrated && isReallyAuth) {
      router.push(redirectTo);
    }
  }, [_hasHydrated, isReallyAuth, router, redirectTo]);

  const onSubmit = async (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Show loading while checking auth or redirecting
  if (!_hasHydrated || isReallyAuth) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md"
    >
      <Card className="border-border shadow-xl shadow-primary/5">
        <CardHeader className="text-center pb-2">
          <motion.div variants={itemVariants}>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary p-2 shadow-lg shadow-primary/20 ring-1 ring-primary/20">
              <Image
                src="/brand/logo.png"
                alt="Confitería Quelita"
                width={64}
                height={64}
                className="h-10 w-auto drop-shadow"
              />
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
          {errorFlag === 'role' && (
            <motion.div
              variants={itemVariants}
              className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800"
              role="alert"
            >
              Tu cuenta no tiene acceso al portal de clientes. Si eres
              administrador o funcionario, ingresa por tu portal
              correspondiente.
            </motion.div>
          )}

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
              <span className="w-full border-t border-border" />
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
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
