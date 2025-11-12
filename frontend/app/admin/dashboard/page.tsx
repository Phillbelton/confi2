'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboard';
import { orderService } from '@/services/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Order } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    positive: boolean;
  };
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              className={`h-3 w-3 ${trend.positive ? 'text-success' : 'text-destructive'}`}
            />
            <span
              className={`text-xs font-medium ${
                trend.positive ? 'text-success' : 'text-destructive'
              }`}
            >
              {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    variant: 'secondary' as const,
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    variant: 'default' as const,
    icon: CheckCircle,
  },
  in_preparation: {
    label: 'En preparación',
    variant: 'default' as const,
    icon: Package,
  },
  ready_for_pickup: {
    label: 'Listo para retiro',
    variant: 'default' as const,
    icon: CheckCircle,
  },
  in_delivery: {
    label: 'En camino',
    variant: 'default' as const,
    icon: Package,
  },
  completed: {
    label: 'Completado',
    variant: 'outline' as const,
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive' as const,
    icon: XCircle,
  },
};

export default function DashboardPage() {
  // Fetch order stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getOrderStats(),
  });

  // Fetch recent orders (limit 10)
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await orderService.getOrders({ limit: 10, page: 1 });
      return response;
    },
  });

  // Calculate metrics from stats
  const stats = statsData?.data?.stats || [];
  const totalOrders = stats.reduce((sum, stat) => sum + stat.count, 0);
  const totalRevenue = stats.reduce((sum, stat) => sum + stat.total, 0);
  const pendingOrders = stats.find((s) => s._id === 'pending')?.count || 0;
  const completedOrders = stats.find((s) => s._id === 'completed')?.count || 0;
  const cancelledOrders = stats.find((s) => s._id === 'cancelled')?.count || 0;

  const orders = ordersData?.data?.orders || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general de tu confitería
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pedidos"
          value={statsLoading ? '...' : totalOrders}
          description="Pedidos totales"
          icon={ShoppingCart}
        />
        <StatCard
          title="Ingresos Totales"
          value={statsLoading ? '...' : `$${totalRevenue.toLocaleString()}`}
          description="Suma de todos los pedidos"
          icon={DollarSign}
        />
        <StatCard
          title="Pedidos Pendientes"
          value={statsLoading ? '...' : pendingOrders}
          description="Requieren confirmación"
          icon={Clock}
        />
        <StatCard
          title="Pedidos Completados"
          value={statsLoading ? '...' : completedOrders}
          description="Entregados exitosamente"
          icon={CheckCircle}
        />
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const config = statusConfig[stat._id as keyof typeof statusConfig];
          if (!config) return null;

          const Icon = config.icon;
          return (
            <Card key={stat._id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${stat.total.toLocaleString()} en ingresos
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pedidos Recientes</CardTitle>
              <CardDescription>Los últimos 10 pedidos realizados</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/pedidos">Ver todos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay pedidos todavía</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: Order) => {
                    const config = statusConfig[order.status];
                    return (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config?.variant || 'default'}>
                            {config?.label || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${order.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/pedidos/${order._id}`}>Ver</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
