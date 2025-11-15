import type { Metadata } from 'next';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';

export const metadata: Metadata = {
  title: 'Panel de Administración - Confitería Quelita',
  description: 'Panel de administración para gestionar productos, órdenes y más',
  robots: 'noindex, nofollow', // Don't index admin pages
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <AdminSidebar />

        <div className="md:pl-64 transition-all duration-300">
          <AdminHeader />

          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
