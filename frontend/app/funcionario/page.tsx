'use client';

import { StatsCards } from '@/components/funcionario/dashboard/StatsCards';
import { RecentOrders } from '@/components/funcionario/dashboard/RecentOrders';
import { useFuncionarioDashboard } from '@/hooks/funcionario/useFuncionarioDashboard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function FuncionarioDashboardPage() {
  const { stats, isLoadingStats, recentOrders, isLoadingRecentOrders, refetch } =
    useFuncionarioDashboard();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gestión de órdenes - Vista del Funcionario
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoadingStats} />

      {/* Recent Orders - Full width */}
      <RecentOrders orders={recentOrders} isLoading={isLoadingRecentOrders} />

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Consejos Rapidos
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>- Revisa las ordenes pendientes en <strong>Pendientes</strong> del menu lateral</li>
          <li>- Usa <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded border">Ctrl+K</kbd> para busqueda rapida</li>
          <li>- El dashboard se actualiza automaticamente cada minuto</li>
          <li>- Haz clic en el numero de orden para ver los detalles</li>
        </ul>
      </div>
    </div>
  );
}
