'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, MessageCircle } from 'lucide-react';
import Link from 'next/link';
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

interface OrdersTableProps {
  orders: Order[];
  onWhatsAppClick: (orderId: string) => void;
  isMarkingWhatsApp: boolean;
}

export function OrdersTable({
  orders,
  onWhatsAppClick,
  isMarkingWhatsApp,
}: OrdersTableProps) {

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
        {orders.map((order) => (
          <Card key={order._id}>
            <CardContent className="p-4 space-y-3">
              {/* Top row: order number + status */}
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/ordenes/${order._id}`}
                  className="font-mono text-sm hover:text-primary hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <OrderStatusBadge status={order.status} />
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
                  {order.whatsappSent ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Enviado
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => onWhatsAppClick(order._id)}
                      disabled={isMarkingWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Marcar
                    </Button>
                  )}
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
        ))}
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
            {orders.map((order) => (
              <TableRow key={order._id}>
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
                  {order.whatsappSent ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Enviado
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onWhatsAppClick(order._id)}
                      disabled={isMarkingWhatsApp}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Marcar
                    </Button>
                  )}
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
            ))}
          </TableBody>
        </Table>
      </div>

    </>
  );
}
