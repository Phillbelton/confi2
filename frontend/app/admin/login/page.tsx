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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Panel de Administración
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa con tu cuenta de administrador
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p>Confitería Quelita © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
