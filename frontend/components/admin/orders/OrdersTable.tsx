'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppHelper } from '@/components/orders/WhatsAppHelper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { Order } from '@/types/order';
import { cn } from '@/lib/utils';
import { isOrderUrgent } from '@/lib/orders';

interface OrdersTableProps {
  orders: Order[];
  /** Se llama tras abrir WhatsApp para marcar el pedido como contactado. */
  onWhatsAppClick: (orderId: string) => void;
}

export function OrdersTable({
  orders,
  onWhatsAppClick,
}: OrdersTableProps) {
  const [whatsappOrder, setWhatsappOrder] = useState<Order | null>(null);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No se encontraron órdenes</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => {
          const isUrgent = isOrderUrgent(order);
          return (
          <Card
            key={order._id}
            className={cn(
              isUrgent &&
                'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
            )}
          >
            <CardContent className="p-4 space-y-3">
              {/* Top row: order number + status */}
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/ordenes/${order._id}`}
                  className="font-mono text-sm hover:text-primary hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <div className="flex items-center gap-2">
                  {isUrgent && (
                    <span
                      className="text-xs font-medium text-orange-600"
                      title="Pendiente hace más de 2 horas"
                    >
                      ⚠️ Urgente
                    </span>
                  )}
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              {/* Customer info */}
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer.email || order.customer.phone}
                </p>
              </div>

              {/* Total + badges */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  ${order.total.toLocaleString()}
                </span>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Retiro'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                  </Badge>
                </div>
              </div>

              {/* Bottom row: date + actions */}
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
                <div className="flex items-center gap-2">
                  {order.whatsappSent && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Enviado
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={() => setWhatsappOrder(order)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Link href={`/admin/ordenes/${order._id}`}>
                    <Button variant="ghost" size="sm" className="min-h-[44px]">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const isUrgent = isOrderUrgent(order);
              return (
              <TableRow
                key={order._id}
                className={cn(
                  isUrgent &&
                    'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
                )}
              >
                <TableCell className="font-mono text-sm">
                  <Link
                    href={`/admin/ordenes/${order._id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  ${order.total.toLocaleString()}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                  {isUrgent && (
                    <p className="mt-1 text-xs font-medium text-orange-600">⚠️ Urgente</p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {order.deliveryMethod === 'delivery'
                        ? 'Delivery'
                        : 'Retiro'}
                    </Badge>
                    <br />
                    <Badge variant="outline" className="text-xs">
                      {order.paymentMethod === 'cash'
                        ? 'Efectivo'
                        : 'Transferencia'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWhatsappOrder(order)}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                    {order.whatsappSent && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Enviado
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/ordenes/${order._id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {whatsappOrder && (
        <WhatsAppHelper
          open
          onOpenChange={(open) => {
            if (!open) setWhatsappOrder(null);
          }}
          order={whatsappOrder}
          onSend={() => {
            if (!whatsappOrder.whatsappSent) {
              onWhatsAppClick(whatsappOrder._id);
            }
          }}
        />
      )}
    </>
  );
}
