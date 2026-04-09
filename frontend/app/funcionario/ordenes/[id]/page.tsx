'use client';

import { use, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  Edit,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Truck,
  Package,
  CreditCard,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFuncionarioOrder } from '@/hooks/funcionario/useFuncionarioOrder';
import { useFuncionarioOrders } from '@/hooks/funcionario/useFuncionarioOrders';
import { OrderStatusBadge } from '@/components/funcionario/orders/OrderStatusBadge';
import { OrderTimeline } from '@/components/funcionario/orders/OrderTimeline';
import { ConfirmOrderModal } from '@/components/funcionario/orders/ConfirmOrderModal';
import { UpdateStatusModal } from '@/components/funcionario/orders/UpdateStatusModal';
import { CancelOrderModal } from '@/components/funcionario/orders/CancelOrderModal';
import { EditOrderItemsModal } from '@/components/funcionario/orders/EditOrderItemsModal';
import { WhatsAppHelper } from '@/components/funcionario/orders/WhatsAppHelper';
import { EditShippingCost } from '@/components/funcionario/orders/EditShippingCost';
import { formatCurrency } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { order, isLoading, error, refetch } = useFuncionarioOrder(resolvedParams.id);

  // Get mutations from orders hook
  const {
    confirmOrder,
    isConfirming,
    updateStatus,
    isUpdatingStatus,
    cancelOrder,
    isCancelling,
    editOrderItems,
    isEditingItems,
    updateShippingCost,
    isUpdatingShippingCost,
  } = useFuncionarioOrders({ page: 1, limit: 1 });

  // Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editItemsModalOpen, setEditItemsModalOpen] = useState(false);
  const [whatsappHelperOpen, setWhatsappHelperOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
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

  if (error || !order || !order.createdAt) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Orden no encontrada</h2>
        <p className="text-slate-500 mb-6">La orden que buscas no existe o no tienes acceso.</p>
        <Link href="/funcionario/ordenes">
          <Button>Volver a órdenes</Button>
        </Link>
      </div>
    );
  }

  const canEdit = ['pending_whatsapp', 'confirmed', 'preparing'].includes(order.status);
  const canConfirm = order.status === 'pending_whatsapp';
  const canCancel = !['completed', 'cancelled'].includes(order.status);
  const canChangeStatus = !['completed', 'cancelled'].includes(order.status);

  // Handle confirm order
  const handleConfirmOrder = (data: { shippingCost: number; adminNotes?: string }) => {
    confirmOrder(
      { id: order._id, data },
      {
        onSuccess: () => {
          setConfirmModalOpen(false);
          refetch();
        },
      }
    );
  };

  // Handle update status
  const handleUpdateStatus = (data: { status: any; adminNotes?: string }) => {
    updateStatus(
      { id: order._id, data },
      {
        onSuccess: () => {
          setUpdateStatusModalOpen(false);
          refetch();
        },
      }
    );
  };

  // Handle cancel order
  const handleCancelOrder = (data: { reason: string }) => {
    cancelOrder(
      { id: order._id, data: { cancellationReason: data.reason } },
      {
        onSuccess: () => {
          setCancelModalOpen(false);
          router.push('/funcionario/ordenes');
        },
      }
    );
  };

  // Handle edit order items
  const handleEditOrderItems = (data: { items: any[]; adminNotes?: string }) => {
    editOrderItems(
      { id: order._id, data },
      {
        onSuccess: () => {
          setEditItemsModalOpen(false);
          refetch();
        },
      }
    );
  };

  // Quick status change
  const handleQuickStatusChange = (newStatus: any) => {
    updateStatus(
      { id: order._id, data: { status: newStatus } },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  // Update shipping cost
  const handleUpdateShippingCost = (newCost: number) => {
    updateShippingCost(
      { id: order._id, shippingCost: newCost },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/funcionario/ordenes">
            <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-mono">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-500">
              Creada{' '}
              {safeFormatDate(
                order.createdAt,
                (d) => formatDistanceToNow(d, { addSuffix: true, locale: es }),
                'fecha desconocida'
              )}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-end sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {order.customer.phone && (
          <Button
            className="gap-2 bg-green-600 hover:bg-green-700 min-h-[44px] sm:min-h-0"
            onClick={() => setWhatsappHelperOpen(true)}
          >
            <MessageCircle className="h-4 w-4" />
            Enviar WhatsApp
          </Button>
        )}

        {canConfirm && (
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 min-h-[44px] sm:min-h-0"
            onClick={() => setConfirmModalOpen(true)}
          >
            <CheckCircle className="h-4 w-4" />
            Confirmar Orden
          </Button>
        )}

        {canChangeStatus && !canConfirm && (
          <Button
            variant="outline"
            className="gap-2 min-h-[44px] sm:min-h-0"
            onClick={() => setUpdateStatusModalOpen(true)}
          >
            <ArrowRight className="h-4 w-4" />
            Cambiar Estado
          </Button>
        )}

        {canEdit && (
          <Button
            variant="outline"
            className="gap-2 min-h-[44px] sm:min-h-0"
            onClick={() => setEditItemsModalOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Editar Productos
          </Button>
        )}

        {canCancel && (
          <Button
            variant="destructive"
            className="gap-2 min-h-[44px] sm:min-h-0"
            onClick={() => setCancelModalOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancelar Orden
          </Button>
        )}
      </div>

      {/* Quick Status Actions */}
      {canChangeStatus && !canConfirm && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
            Acciones rapidas de estado:
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {order.status === 'confirmed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickStatusChange('preparing')}
                disabled={isUpdatingStatus}
                className="gap-2 min-h-[44px] sm:min-h-0"
              >
                <Package className="h-4 w-4" />
                Marcar como Preparando
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickStatusChange('shipped')}
                disabled={isUpdatingStatus}
                className="gap-2 min-h-[44px] sm:min-h-0"
              >
                <Truck className="h-4 w-4" />
                Marcar como Enviada
              </Button>
            )}
            {order.status === 'shipped' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickStatusChange('completed')}
                disabled={isUpdatingStatus}
                className="gap-2 min-h-[44px] sm:min-h-0 text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4" />
                Marcar como Completada
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Nombre</p>
                  <p className="font-semibold">{order.customer.name}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <p className="text-sm text-slate-500">Teléfono</p>
                  </div>
                  <p className="font-semibold">{order.customer.phone}</p>
                </div>
                {order.customer.email && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <p className="text-sm text-slate-500">Email</p>
                    </div>
                    <p className="font-semibold text-sm">{order.customer.email}</p>
                  </div>
                )}
              </div>

              {order.customer.address && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <p className="text-sm text-slate-500">Dirección de Entrega</p>
                    </div>
                    <p className="font-semibold">
                      {order.customer.address.street} {order.customer.address.number}
                    </p>
                    <p className="text-sm text-slate-600">
                      {order.customer.address.neighborhood && `${order.customer.address.neighborhood}, `}
                      {order.customer.address.city}
                    </p>
                    {order.customer.address.reference && (
                      <p className="text-sm text-slate-500 mt-1">
                        <span className="font-medium">Referencia:</span> {order.customer.address.reference}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">
                Productos ({order.items.length})
              </CardTitle>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] sm:min-h-0 shrink-0"
                  onClick={() => setEditItemsModalOpen(true)}
                >
                  Editar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="pb-4 border-b last:border-0">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      {item.variantSnapshot.image && (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                          <img
                            src={item.variantSnapshot.image}
                            alt={item.variantSnapshot.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.variantSnapshot.name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          SKU: {item.variantSnapshot.sku}
                        </p>

                        {/* Attributes */}
                        {item.variantSnapshot.attributes &&
                          Object.keys(item.variantSnapshot.attributes).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(item.variantSnapshot.attributes).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Pricing - below on mobile for better layout */}
                    <div className="mt-2 ml-0 sm:ml-[calc(theme(spacing.16)+theme(spacing.3))] space-y-1">
                      <p className="text-sm">
                        {item.quantity} × {formatCurrency(item.pricePerUnit)} ={' '}
                        <span className="font-semibold">
                          {formatCurrency(item.quantity * item.pricePerUnit)}
                        </span>
                      </p>
                      {item.discount > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Descuento: -{formatCurrency(item.discount)}
                        </p>
                      )}
                      <p className="text-sm font-semibold">
                        Subtotal: {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Descuentos totales:</span>
                    <span className="font-semibold">-{formatCurrency(order.totalDiscount)}</span>
                  </div>
                )}
                <EditShippingCost
                  currentCost={order.shippingCost}
                  onSave={handleUpdateShippingCost}
                  isSaving={isUpdatingShippingCost}
                  canEdit={canEdit}
                />
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.customerNotes || order.deliveryNotes || order.adminNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas y Observaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.customerNotes && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      💬 Notas del cliente:
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                      <p className="text-sm">{order.customerNotes}</p>
                    </div>
                  </div>
                )}

                {order.deliveryNotes && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      🚚 Instrucciones de entrega:
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                      <p className="text-sm">{order.deliveryNotes}</p>
                    </div>
                  </div>
                )}

                {order.adminNotes && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      🔒 Notas administrativas:
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm">{order.adminNotes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Timeline & Details */}
        <div className="space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-slate-500" />
                  <p className="text-sm text-slate-500">Método de entrega</p>
                </div>
                <Badge variant="outline">
                  {order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '📦 Retiro'}
                </Badge>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  <p className="text-sm text-slate-500">Método de pago</p>
                </div>
                <Badge variant="outline">
                  {order.paymentMethod === 'cash' ? '💵 Efectivo' : '💳 Transferencia'}
                </Badge>
              </div>

              {order.whatsappSent && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-slate-500">WhatsApp</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-600 dark:text-green-400">Enviado</p>
                    </div>
                    {order.whatsappSentAt && (
                      <p className="text-xs text-slate-500 mt-1">
                        {safeFormatDate(
                          order.whatsappSentAt,
                          (d) => format(d, "d/MM/yyyy 'a las' HH:mm", { locale: es })
                        )}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <OrderTimeline order={order} />
        </div>
      </div>

      {/* Modals */}
      {canConfirm && (
        <ConfirmOrderModal
          open={confirmModalOpen}
          onOpenChange={setConfirmModalOpen}
          order={order}
          onConfirm={handleConfirmOrder}
          isConfirming={isConfirming}
        />
      )}

      {canChangeStatus && (
        <UpdateStatusModal
          open={updateStatusModalOpen}
          onOpenChange={setUpdateStatusModalOpen}
          order={order}
          onUpdate={handleUpdateStatus}
          isUpdating={isUpdatingStatus}
        />
      )}

      {canCancel && (
        <CancelOrderModal
          open={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
          order={order}
          onCancel={handleCancelOrder}
          isCancelling={isCancelling}
        />
      )}

      {canEdit && (
        <EditOrderItemsModal
          open={editItemsModalOpen}
          onOpenChange={setEditItemsModalOpen}
          order={order}
          onSave={handleEditOrderItems}
          isSaving={isEditingItems}
        />
      )}

      <WhatsAppHelper
        open={whatsappHelperOpen}
        onOpenChange={setWhatsappHelperOpen}
        order={order}
        onSend={(message) => {
          // Optional: Log sent message or mark as sent in backend
          console.log('WhatsApp message sent:', message);
        }}
      />
    </div>
  );
}

function safeFormatDate(date: Date | string | undefined | null, formatFn: (d: Date) => string, fallback: string = '-'): string {
  if (!date) return fallback;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return fallback;
    return formatFn(dateObj);
  } catch {
    return fallback;
  }
}
