'use client';

import dynamic from 'next/dynamic';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/admin/dashboard/StatsCard';
import { useAdminDashboard } from '@/hooks/admin/useAdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic imports para componentes pesados (con recharts)
const SalesChart = dynamic(
  () => import('@/components/admin/dashboard/SalesChart').then(mod => ({ default: mod.SalesChart })),
  { loading: () => <Skeleton className="h-[400px]" /> }
);

const RecentOrders = dynamic(
  () => import('@/components/admin/dashboard/RecentOrders').then(mod => ({ default: mod.RecentOrders })),
  { loading: () => <Skeleton className="h-[400px]" /> }
);

const TopProducts = dynamic(
  () => import('@/components/admin/dashboard/TopProducts').then(mod => ({ default: mod.TopProducts })),
  { loading: () => <Skeleton className="h-[400px]" /> }
);

const LowStockAlert = dynamic(
  () => import('@/components/admin/dashboard/LowStockAlert').then(mod => ({ default: mod.LowStockAlert })),
  { loading: () => <Skeleton className="h-[300px]" /> }
);

export default function AdminDashboardPage() {
  const {
    stats,
    isLoadingStats,
    salesData,
    isLoadingSalesData,
    topProducts,
    isLoadingTopProducts,
    recentOrders,
    isLoadingRecentOrders,
    lowStock,
    isLoadingLowStock,
  } = useAdminDashboard();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de tu tienda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Ventas de Hoy"
              value={`$${stats?.todaySales.toLocaleString() || 0}`}
              description="Total de ventas del día"
              icon={DollarSign}
            />
            <StatsCard
              title="Órdenes Pendientes"
              value={stats?.pendingOrders || 0}
              description="Órdenes por confirmar"
              icon={ShoppingCart}
            />
            <StatsCard
              title="Stock Bajo"
              value={stats?.lowStockProducts || 0}
              description="Productos por reabastecer"
              icon={Package}
            />
            <StatsCard
              title="Total Productos"
              value={stats?.totalProducts || 0}
              description="Productos activos"
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          {isLoadingSalesData ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <SalesChart data={salesData || []} />
          )}
        </div>

        {/* Recent Orders */}
        <div>
          {isLoadingRecentOrders ? (
            <Skeleton className="h-[500px]" />
          ) : (
            <RecentOrders orders={recentOrders || []} />
          )}
        </div>

        {/* Top Products */}
        <div>
          {isLoadingTopProducts ? (
            <Skeleton className="h-[500px]" />
          ) : (
            <TopProducts products={topProducts || []} />
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      <div>
        {isLoadingLowStock ? (
          <Skeleton className="h-[300px]" />
        ) : (
          <LowStockAlert variants={lowStock || []} />
        )}
      </div>
    </div>
  );
}
