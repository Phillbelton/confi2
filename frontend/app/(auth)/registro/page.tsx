'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
    acceptTerms: z.literal(true, 'Debes aceptar los términos'),
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

// Password requirements
const passwordRequirements = [
  { label: 'Mínimo 6 caracteres', test: (p: string) => p.length >= 6 },
  { label: 'Una letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un número', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isAuthenticated, _hasHydrated } = useClientStore();
  const registerMutation = useClientRegister();

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
      acceptTerms: false as any,
    },
  });

  const password = watch('password');
  const acceptTerms = watch('acceptTerms');

  // Redirigir si ya está autenticado
  if (_hasHydrated && isAuthenticated) {
    router.push('/perfil');
    return null;
  }

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, acceptTerms, ...registerData } = data;
    // Prepend +56 and remove spaces from phone
    const phoneClean = registerData.phone.replace(/\s/g, '');
    registerMutation.mutate({
      ...registerData,
      phone: `+56${phoneClean}`,
    });
  };

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
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <motion.div variants={itemVariants}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">
                  Q
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
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Juan Pérez"
                    className={cn(
                      'h-12',
                      errors.name && 'border-destructive focus-visible:ring-destructive'
                    )}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className={cn(
                      'h-12',
                      errors.email && 'border-destructive focus-visible:ring-destructive'
                    )}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </motion.div>

                {/* Teléfono */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
                  <div className="flex">
                    <div className="flex items-center justify-center px-3 h-12 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground font-medium">
                      +56
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="9 1234 5678"
                      className={cn(
                        'h-12 rounded-l-none',
                        errors.phone && 'border-destructive focus-visible:ring-destructive'
                      )}
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </motion.div>

                {/* Contraseña */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={cn(
                        'h-12 pr-10',
                        errors.password && 'border-destructive focus-visible:ring-destructive'
                      )}
                      {...register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}

                  {/* Password requirements */}
                  {password && (
                    <div className="space-y-1 pt-1">
                      {passwordRequirements.map(({ label, test }) => {
                        const passed = test(password);
                        return (
                          <div
                            key={label}
                            className={cn(
                              'flex items-center gap-2 text-xs transition-colors',
                              passed ? 'text-green-600' : 'text-muted-foreground'
                            )}
                          >
                            {passed ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                {/* Confirmar contraseña */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={cn(
                        'h-12 pr-10',
                        errors.confirmPassword &&
                          'border-destructive focus-visible:ring-destructive'
                      )}
                      {...register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </motion.div>

                {/* Términos */}
                <motion.div variants={itemVariants} className="flex items-start gap-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) =>
                      setValue('acceptTerms', checked === true ? true : (false as unknown as true))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="acceptTerms" className="text-sm leading-relaxed">
                    Acepto los{' '}
                    <Link href="/terminos" className="text-primary hover:underline">
                      términos y condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link href="/privacidad" className="text-primary hover:underline">
                      política de privacidad
                    </Link>
                  </Label>
                </motion.div>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive -mt-2">
                    {errors.acceptTerms.message}
                  </p>
                )}

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear cuenta'
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-0">
              <motion.div variants={itemVariants} className="text-center text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Iniciar sesión
                </Link>
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
