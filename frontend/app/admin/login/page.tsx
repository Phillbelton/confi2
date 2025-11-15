'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/components/admin/auth/LoginForm';
import { useAdminStore } from '@/store/useAdminStore';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminStore();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-700 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-600 p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Panel de Administración
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ingresa con tu cuenta de administrador
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Confitería Quelita © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
