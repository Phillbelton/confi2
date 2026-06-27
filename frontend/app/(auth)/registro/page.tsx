'use client';

import { useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
      .min(8, 'Mínimo 8 caracteres')
      .max(128, 'Máximo 128 caracteres')
      .regex(/[A-Z]/, 'Debe incluir una mayúscula')
      .regex(/[a-z]/, 'Debe incluir una minúscula')
      .regex(/[0-9]/, 'Debe incluir un número')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        'Debe incluir un carácter especial'
      ),
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
    control,
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

  const password = useWatch({ control, name: 'password' });
  const confirmPassword = useWatch({ control, name: 'confirmPassword' });
  const passwordsMatch = password && confirmPassword && password === confirmPassword ? true : undefined;

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/perfil');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    // Excluir confirmPassword (Zod ya validó que coincide) y normalizar phone.
    const { confirmPassword: _confirmPassword, ...registerData } = data;
    const phoneClean = registerData.phone.replace(/\s/g, '');
    registerMutation.mutate({
      ...registerData,
      phone: `+56${phoneClean}`,
    });
  };

  // Show loading while checking auth or redirecting
  if (!_hasHydrated || isAuthenticated) {
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
            <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
          </motion.div>
          <motion.div variants={itemVariants}>
            <CardDescription>
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
                label="Nombre"
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
              <Label htmlFor="phone" className="text-sm font-medium">
                Teléfono (WhatsApp)
              </Label>
              <div className="flex mt-1.5">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
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
          <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Iniciar sesión
            </Link>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
