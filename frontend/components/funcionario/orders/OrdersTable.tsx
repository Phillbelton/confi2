'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, MessageCircle, CheckCircle, Truck, Package } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/types/order';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  onMarkWhatsApp?: (orderId: string) => void;
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

export function OrdersTable({ orders, isLoading, onMarkWhatsApp }: OrdersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No se encontraron órdenes</p>
        <p className="text-sm text-slate-400">Intenta ajustar los filtros</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">N° Orden</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="w-[120px]">Total</TableHead>
            <TableHead className="w-[140px]">Estado</TableHead>
            <TableHead className="w-[120px]">Hace</TableHead>
            <TableHead className="text-right w-[150px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isUrgent =
              order.status === 'pending_whatsapp' &&
              new Date().getTime() - new Date(order.createdAt).getTime() > 2 * 60 * 60 * 1000; // > 2 hours

            return (
              <TableRow
                key={order._id}
                className={cn(
                  'hover:bg-slate-50 dark:hover:bg-slate-800',
                  isUrgent && 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                )}
              >
                {/* Order Number */}
                <TableCell className="font-mono font-semibold text-sm">
                  <Link
                    href={`/funcionario/ordenes/${order._id}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {order.orderNumber}
                  </Link>
                </TableCell>

                {/* Customer */}
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{order.customer.name}</p>
                    <p className="text-xs text-slate-500">
                      {order.customer.phone}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '📦 Retiro'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {order.paymentMethod === 'cash' ? '💵 Efectivo' : '💳 Transfer.'}
                      </Badge>
                    </div>
                  </div>
                </TableCell>

                {/* Total */}
                <TableCell className="font-semibold">
                  {formatCurrency(order.total)}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                  {isUrgent && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      ⚠️ Urgente
                    </p>
                  )}
                </TableCell>

                {/* Time */}
                <TableCell className="text-sm text-slate-500">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* View */}
                    <Link href={`/funcionario/ordenes/${order._id}`}>
                      <Button variant="ghost" size="icon" title="Ver detalle">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>

                    {/* WhatsApp */}
                    {order.customer.phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Abrir WhatsApp"
                        onClick={() => {
                          window.open(
                            `https://wa.me/${order.customer.phone.replace(/\D/g, '')}`,
                            '_blank'
                          );
                          if (onMarkWhatsApp && !order.whatsappSent) {
                            onMarkWhatsApp(order._id);
                          }
                        }}
                      >
                        <MessageCircle className={cn(
                          'h-4 w-4',
                          order.whatsappSent ? 'text-green-600' : 'text-slate-400'
                        )} />
                      </Button>
                    )}

                    {/* Next Status Quick Action */}
                    {order.status === 'pending_whatsapp' && (
                      <Link href={`/funcionario/ordenes/${order._id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Confirmar orden"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}

                    {order.status === 'preparing' && (
                      <Link href={`/funcionario/ordenes/${order._id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Marcar como enviada"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function formatCurrency(value: number): string {
  return '$' + new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
