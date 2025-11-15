'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, User, MapPin, Phone, Mail, FileText, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from './OrderStatusBadge';
import { UpdateOrderStatus } from './UpdateOrderStatus';
import type { Order, OrderItem } from '@/types/order';

interface OrderDetailModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, open, onClose }: OrderDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orden {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Creada{' '}
            {format(new Date(order.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
              locale: es,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <OrderStatusBadge status={order.status} />
            {order.whatsappSent && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                WhatsApp Enviado
              </Badge>
            )}
          </div>

          {/* Update Status */}
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <>
              <Separator />
              <UpdateOrderStatus orderId={order._id} currentStatus={order.status} />
            </>
          )}

          <Separator />

          {/* Customer Info */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Nombre</p>
                  <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                </div>
              </div>
              {order.customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dirección</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.address.street} {order.customer.address.number}
                      <br />
                      {order.customer.address.city}
                      {order.customer.address.neighborhood &&
                        `, ${order.customer.address.neighborhood}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Detalles de la Orden</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Método de Entrega</p>
                <Badge variant="outline" className="mt-1">
                  {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Retiro en tienda'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Método de Pago</p>
                <Badge variant="outline" className="mt-1">
                  {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Productos</h3>
            <div className="space-y-3">
              {order.items.map((item: OrderItem, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  {item.variantSnapshot.image && (
                    <img
                      src={item.variantSnapshot.image}
                      alt={item.variantSnapshot.name}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.variantSnapshot.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.variantSnapshot.sku}
                    </p>
                    {Object.keys(item.variantSnapshot.attributes).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {Object.entries(item.variantSnapshot.attributes)
                          .map(([key, value]: [string, string]) => `${key}: ${value}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">x{item.quantity}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.pricePerUnit.toLocaleString()}
                    </p>
                    {item.discount > 0 && (
                      <p className="text-xs text-green-600">
                        -${item.discount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right font-semibold">
                    ${item.subtotal.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${order.subtotal.toLocaleString()}</span>
            </div>
            {order.totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento</span>
                <span>-${order.totalDiscount.toLocaleString()}</span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span>Envío</span>
                <span>${order.shippingCost.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${order.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Notes */}
          {(order.customerNotes || order.adminNotes || order.deliveryNotes) && (
            <>
              <Separator />
              <div className="space-y-3">
                {order.customerNotes && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas del Cliente
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {order.customerNotes}
                    </p>
                  </div>
                )}
                {order.deliveryNotes && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Notas de Entrega
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {order.deliveryNotes}
                    </p>
                  </div>
                )}
                {order.adminNotes && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas de Admin
                    </p>
                    <p className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      {order.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Cancellation Info */}
          {order.status === 'cancelled' && order.cancellationReason && (
            <>
              <Separator />
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-900 mb-1">
                  Motivo de Cancelación
                </p>
                <p className="text-sm text-red-700">{order.cancellationReason}</p>
                {order.cancelledAt && (
                  <p className="text-xs text-red-600 mt-2">
                    Cancelada el{' '}
                    {format(new Date(order.cancelledAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
