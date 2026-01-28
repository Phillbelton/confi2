'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { Input } from '@/components/ui/input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useClientRegister } from '@/hooks/client/useClientAuth';
import { useClientStore } from '@/store/useClientStore';
import { cn } from '@/lib/utils';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres'),
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Email inválido'),
    phone: z
      .string()
      .min(1, 'El teléfono es requerido')
      .regex(/^9\s?\d{4}\s?\d{4}$/, 'Formato: 9 1234 5678'),
    password: z
      .string()
      .min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/perfil';
  const { isAuthenticated, _hasHydrated } = useClientStore();
  const registerMutation = useClientRegister(redirectTo);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const passwordsMatch = password && confirmPassword && password === confirmPassword ? true : undefined;

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/perfil');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    // Prepend +56 and remove spaces from phone
    const phoneClean = registerData.phone.replace(/\s/g, '');
    registerMutation.mutate({
      ...registerData,
      phone: `+56${phoneClean}`,
    });
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
      <main className="flex-1 flex items-start justify-center p-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <Card className="bg-gradient-to-b from-slate-800/95 to-slate-900/95 border border-white/10 shadow-xl">
            <CardHeader className="text-center pb-2">
              <motion.div variants={itemVariants}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">
                  Q
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardTitle className="text-2xl text-white">Crea tu cuenta</CardTitle>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardDescription className="text-gray-400">
                  Para seguir tus pedidos fácilmente
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nombre */}
                <motion.div variants={itemVariants}>
                  <AnimatedInput
                    id="name"
                    type="text"
                    label="Nombre completo"
                    autoComplete="name"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                </motion.div>

                {/* Email */}
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

                {/* Teléfono */}
                <motion.div variants={itemVariants}>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-300">
                    Teléfono (WhatsApp)
                  </Label>
                  <div className="flex mt-1.5">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/20 bg-slate-700/50 text-gray-400 text-sm">
                      +56
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="9 1234 5678"
                      maxLength={11}
                      className={cn(
                        'rounded-l-none',
                        errors.phone && 'border-destructive focus-visible:ring-destructive'
                      )}
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </motion.div>

                {/* Contraseña */}
                <motion.div variants={itemVariants}>
                  <AnimatedInput
                    id="password"
                    type="password"
                    label="Contraseña"
                    autoComplete="new-password"
                    showPasswordToggle
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  <PasswordStrength password={password || ''} />
                </motion.div>

                {/* Confirmar contraseña */}
                <motion.div variants={itemVariants}>
                  <AnimatedInput
                    id="confirmPassword"
                    type="password"
                    label="Confirmar contraseña"
                    autoComplete="new-password"
                    showPasswordToggle
                    success={passwordsMatch}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <AnimatedButton
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    loading={registerMutation.isPending}
                    loadingText="Creando cuenta..."
                    showShine
                  >
                    Crear cuenta
                  </AnimatedButton>
                </motion.div>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-0">
              <motion.div variants={itemVariants} className="text-center text-sm text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Iniciar sesión
                </Link>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Link
                  href="/"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
