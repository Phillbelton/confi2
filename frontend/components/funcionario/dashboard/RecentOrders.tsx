'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/types/order';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RecentOrdersProps {
  orders: Order[];
  isLoading?: boolean;
}

const statusColors = {
  pending_whatsapp: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels = {
  pending_whatsapp: 'Pendiente',
  confirmed: 'Confirmada',
  preparing: 'Preparando',
  shipped: 'Enviada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">
            No hay órdenes recientes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Órdenes Recientes</CardTitle>
        <Link href="/funcionario/ordenes">
          <Button variant="ghost" size="sm">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order._id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold">
                    {order.orderNumber}
                  </span>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {order.customer.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <div className="text-right mr-2">
                  <p className="text-sm font-semibold">
                    {formatCurrency(order.total)}
                  </p>
                </div>
                <Link href={`/funcionario/ordenes/${order._id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                {order.customer.phone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      window.open(
                        `https://wa.me/${order.customer.phone.replace(/\D/g, '')}`,
                        '_blank'
                      );
                    }}
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  return '$' + new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
