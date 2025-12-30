'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/types/order';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface RecentOrdersProps {
  orders: Order[];
  isLoading?: boolean;
}

const statusColors = {
  pending_whatsapp: 'bg-yellow-900/40 text-yellow-400',
  confirmed: 'bg-blue-900/40 text-blue-400',
  preparing: 'bg-purple-900/40 text-purple-400',
  shipped: 'bg-indigo-900/40 text-indigo-400',
  completed: 'bg-green-900/40 text-green-400',
  cancelled: 'bg-red-900/40 text-red-400',
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
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-400 py-8">
            No hay órdenes recientes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-100">Órdenes Recientes</CardTitle>
        <Link href="/funcionario/ordenes">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order._id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold text-slate-100">
                    {order.orderNumber}
                  </span>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 truncate">
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
                  <p className="text-sm font-semibold text-slate-100">
                    {formatCurrency(order.total)}
                  </p>
                </div>
                <Link href={`/funcionario/ordenes/${order._id}`}>
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-700">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                {order.customer.phone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-green-400 hover:text-green-300 hover:bg-slate-700"
                    onClick={() => {
                      window.open(
                        `https://wa.me/${order.customer.phone.replace(/\D/g, '')}`,
                        '_blank'
                      );
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
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
