'use client';

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToasts } from '@/hooks/use-toast';
import { Button } from './button';
import { cn } from '@/lib/utils';
import type { ToastVariant } from '@/hooks/use-toast';

const variantConfig: Record<ToastVariant, { icon: any; className: string }> = {
  default: {
    icon: Info,
    className: 'bg-card border-border',
  },
  destructive: {
    icon: AlertCircle,
    className: 'bg-destructive text-destructive-foreground border-destructive',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-600 text-white border-green-700',
  },
};

export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 md:max-w-md">
      {toasts.map((toast) => {
        const config = variantConfig[toast.variant || 'default'];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-5',
              config.className
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {toast.title && (
                <div className="font-semibold">{toast.title}</div>
              )}
              {toast.description && (
                <div className={cn('text-sm', toast.title && 'mt-1')}>
                  {toast.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
