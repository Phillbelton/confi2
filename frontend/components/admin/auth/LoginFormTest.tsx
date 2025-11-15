'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginFormTest() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    console.log('Form submitted:', values);
    alert('Email: ' + values.email);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            {...form.register('email')}
            type="email"
            placeholder="admin@example.com"
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600"
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            {...form.register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600"
          />
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
      >
        Iniciar Sesión
      </button>
    </form>
  );
}
