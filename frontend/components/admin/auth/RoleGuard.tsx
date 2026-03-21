'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';

type UserRole = 'admin' | 'funcionario' | 'cliente';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * RoleGuard - Component to protect pages based on user role
 * 
 * Usage:
 * <RoleGuard allowedRoles={['admin']}>
 *   <AdminOnlyPage />
 * </RoleGuard>
 */
export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const router = useRouter();
  const { user } = useAdminStore();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role as UserRole)) {
      // Redirect to appropriate dashboard or specified path
      const defaultRedirect = user.role === 'funcionario' ? '/funcionario' : '/admin';
      router.push(redirectTo || defaultRedirect);
    }
  }, [user, allowedRoles, redirectTo, router]);

  // If user doesn't have permission, don't render children
  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return null;
  }

  return <>{children}</>;
}
