'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { RecentOrder } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RecentOrdersProps {
  orders: RecentOrder[];
}

const statusColors: Record<string, string> = {
  pending_whatsapp: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  preparing: 'bg-purple-500',
  shipped: 'bg-indigo-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  pending_whatsapp: 'Pendiente WhatsApp',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Órdenes Recientes</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/ordenes">
            Ver todas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay órdenes recientes
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <Badge
                      variant="secondary"
                      className={statusColors[order.status]}
                    >
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(order.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${order.total.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
