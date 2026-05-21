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
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-400">
            Gestión de órdenes - Vista del Funcionario
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
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
      <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-3 sm:p-4">
        <h3 className="font-semibold text-blue-100 mb-2">
          Consejos Rapidos
        </h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>- Revisa las ordenes pendientes en <strong>Pendientes</strong> del menu lateral</li>
          <li>- Usa <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600 text-slate-300">Ctrl+K</kbd> para busqueda rapida</li>
          <li>- El dashboard se actualiza automaticamente cada minuto</li>
          <li>- Haz clic en el numero de orden para ver los detalles</li>
        </ul>
      </div>
    </div>
  );
}
