import React from 'react';
import { Info, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InlineHelpProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'error';
  className?: string;
}

export function InlineHelp({ children, variant = 'info', className = '' }: InlineHelpProps) {
  const variants = {
    info: {
      icon: Info,
      className: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
    },
    success: {
      icon: CheckCircle2,
      className: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
    },
    error: {
      icon: AlertCircle,
      className: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
    },
  };

  const { icon: Icon, className: variantClassName } = variants[variant];

  return (
    <Alert className={`${variantClassName} ${className}`}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="text-sm">
        {children}
      </AlertDescription>
    </Alert>
  );
}
