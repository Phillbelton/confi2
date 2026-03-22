'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Edit,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { UpdateOrderStatus } from '@/components/admin/orders/UpdateOrderStatus';
import { EditOrderItems } from '@/components/admin/orders/EditOrderItems';
import { useAdminOrder, useAdminOrders } from '@/hooks/admin/useAdminOrders';
import { formatCurrency } from '@/lib/utils';
import { getImageUrl } from '@/lib/images';

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { order, isLoading, error, refetch } = useAdminOrder(resolvedParams.id);
  const { cancelOrder, isCancelling } = useAdminOrders({ page: 1, limit: 1 });

  const [isEditing, setIsEditing] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Orden no encontrada</h2>
        <p className="text-muted-foreground mb-6">
          La orden que buscas no existe o no tienes acceso.
        </p>
        <Link href="/admin/ordenes">
          <Button>Volver a ordenes</Button>
        </Link>
      </div>
    );
  }

  const isEditable = ['pending_whatsapp', 'confirmed', 'preparing'].includes(order.status);
  const canCancel = !['completed', 'cancelled'].includes(order.status);
  const canChangeStatus = !['completed', 'cancelled'].includes(order.status);

  const handleCancelOrder = () => {
    if (cancelReason.trim().length < 10) return;
    cancelOrder(
      { id: order._id, data: { cancellationReason: cancelReason.trim() } },
      {
        onSuccess: () => {
          setCancelDialogOpen(false);
          setCancelReason('');
          refetch();
        },
      }
    );
  };

  const customerPhone = order.customer.phone?.replace(/\D/g, '') || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/ordenes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Creada{' '}
              {safeFormatDate(
                order.createdAt,
                (d) => formatDistanceToNow(d, { addSuffix: true, locale: es }),
                'fecha desconocida'
              )}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {customerPhone && (
          <Button
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() =>
              window.open(`https://wa.me/${customerPhone}`, '_blank')
            }
          >
            <MessageCircle className="h-4 w-4" />
            Abrir WhatsApp
          </Button>
        )}

        {isEditable && !isEditing && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
            Editar Productos
          </Button>
        )}

        {canCancel && (
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setCancelDialogOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancelar Orden
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Mode */}
          {isEditing && (
            <EditOrderItems
              order={order}
              onSuccess={() => {
                setIsEditing(false);
                refetch();
              }}
              onCancel={() => setIsEditing(false)}
            />
          )}

          {/* Update Status */}
          {!isEditing && canChangeStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actualizar Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <UpdateOrderStatus orderId={order._id} currentStatus={order.status} />
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Informacion del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nombre</p>
                  <p className="font-semibold">{order.customer.name}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Telefono</p>
                  </div>
                  <p className="font-semibold">{order.customer.phone}</p>
                </div>
                {order.customer.email && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                    <p className="font-semibold text-sm">{order.customer.email}</p>
                  </div>
                )}
              </div>

              {order.customer.address && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Direccion de Entrega</p>
                    </div>
                    <p className="font-semibold">
                      {order.customer.address.street} {order.customer.address.number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.address.neighborhood &&
                        `${order.customer.address.neighborhood}, `}
                      {order.customer.address.city}
                    </p>
                    {order.customer.address.reference && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Referencia:</span>{' '}
                        {order.customer.address.reference}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    {item.variantSnapshot.image && (
                      <img
                        src={getImageUrl(item.variantSnapshot.image)}
                        alt={item.variantSnapshot.name}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.variantSnapshot.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        SKU: {item.variantSnapshot.sku}
                      </p>
                      {Object.keys(item.variantSnapshot.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.variantSnapshot.attributes).map(
                            ([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">x{item.quantity}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.pricePerUnit)}
                      </p>
                      {item.discount > 0 && (
                        <p className="text-xs text-green-600">
                          -{formatCurrency(item.discount)}
                        </p>
                      )}
                    </div>
                    <div className="text-right font-semibold min-w-[90px]">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(order.totalDiscount)}</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envio</span>
                    <span>{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.customerNotes || order.deliveryNotes || order.adminNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas y Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.customerNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Notas del cliente
                    </p>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">{order.customerNotes}</p>
                    </div>
                  </div>
                )}
                {order.deliveryNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Instrucciones de entrega
                    </p>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">{order.deliveryNotes}</p>
                    </div>
                  </div>
                )}
                {order.adminNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Notas administrativas
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm">{order.adminNotes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Metodo de entrega</p>
                </div>
                <Badge variant="outline">
                  {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Retiro en tienda'}
                </Badge>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Metodo de pago</p>
                </div>
                <Badge variant="outline">
                  {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                </Badge>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                </div>
                {order.whatsappSent ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Enviado
                      </Badge>
                    </div>
                    {order.whatsappSentAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {safeFormatDate(
                          order.whatsappSentAt,
                          (d) =>
                            format(d, "d/MM/yyyy 'a las' HH:mm", { locale: es })
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    No enviado
                  </Badge>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha de creacion</p>
                <p className="text-sm font-medium">
                  {safeFormatDate(
                    order.createdAt,
                    (d) => format(d, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })
                  )}
                </p>
              </div>

              {order.updatedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ultima actualizacion</p>
                    <p className="text-sm font-medium">
                      {safeFormatDate(
                        order.updatedAt,
                        (d) => format(d, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cancellation Info */}
          {order.status === 'cancelled' && order.cancellationReason && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-base text-red-700 dark:text-red-400">
                  Orden Cancelada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                    Motivo de cancelacion
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {order.cancellationReason}
                  </p>
                  {order.cancelledAt && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Cancelada el{' '}
                      {safeFormatDate(
                        order.cancelledAt,
                        (d) =>
                          format(d, "d 'de' MMMM, yyyy 'a las' HH:mm", {
                            locale: es,
                          })
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Orden {order.orderNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El stock reservado sera restaurado
              automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Cliente:</span> {order.customer.name}
              </p>
              <p>
                <span className="font-medium">Total:</span>{' '}
                {formatCurrency(order.total)}
              </p>
              <p>
                <span className="font-medium">Estado actual:</span>{' '}
                <OrderStatusBadge status={order.status} />
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motivo de cancelacion <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe el motivo de la cancelacion (min. 10 caracteres)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {cancelReason.trim().length}/10 caracteres minimos
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                'Cliente no responde',
                'Sin stock disponible',
                'Pedido duplicado',
                'Cliente solicito cancelacion',
                'Error en el pedido',
              ].map((reason) => (
                <Button
                  key={reason}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setCancelReason(reason)}
                >
                  {reason}
                </Button>
              ))}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason('')}>
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={cancelReason.trim().length < 10 || isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? 'Cancelando...' : 'Confirmar Cancelacion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function safeFormatDate(
  date: Date | string | undefined | null,
  formatFn: (d: Date) => string,
  fallback: string = '-'
): string {
  if (!date) return fallback;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return fallback;
    return formatFn(dateObj);
  } catch {
    return fallback;
  }
}
