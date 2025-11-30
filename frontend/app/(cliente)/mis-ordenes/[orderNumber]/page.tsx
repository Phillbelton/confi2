'use client';

import { useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronLeft,
  MapPin,
  Phone,
  CreditCard,
  MessageCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  ChefHat,
  Truck,
  XCircle,
  Send,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderDetail, getOrderStatusConfig, canCancelOrder, useCancelOrder } from '@/hooks/client/useClientOrders';
import { CancelOrderModal } from '@/components/client/CancelOrderModal';
import { useCartStore } from '@/store/useCartStore';
import type { Order, OrderStatus, OrderItem } from '@/types/order';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
} as const;

// Timeline steps
const timelineSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending_whatsapp', label: 'Enviado', icon: Send },
  { status: 'confirmed', label: 'Confirmado', icon: CheckCircle },
  { status: 'preparing', label: 'Preparando', icon: ChefHat },
  { status: 'shipped', label: 'En camino', icon: Truck },
  { status: 'completed', label: 'Entregado', icon: Package },
];

const statusOrder: Record<OrderStatus, number> = {
  pending_whatsapp: 0,
  confirmed: 1,
  preparing: 2,
  shipped: 3,
  completed: 4,
  cancelled: -1,
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const router = useRouter();
  const { data: order, isLoading, error, refetch } = useOrderDetail(orderNumber);
  const addItem = useCartStore((state) => state.addItem);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const handleReorder = async () => {
    if (!order) return;

    // Agregar items al carrito
    toast.promise(
      (async () => {
        // En una implementación real, verificaríamos disponibilidad
        // Por ahora, simplemente mostramos mensaje
        router.push('/productos');
      })(),
      {
        loading: 'Preparando pedido...',
        success: 'Ve al catálogo para agregar los productos',
        error: 'No se pudo preparar el pedido',
      }
    );
  };
const handleCancelOrder = (reason: string) => {    if (!order) return;        cancelOrder(      { orderId: order._id, reason },      {        onSuccess: () => {          setCancelModalOpen(false);          router.push('/mis-ordenes');        },      }    );  };

  const handleContactWhatsApp = () => {
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
    const message = encodeURIComponent(
      `Hola, tengo una consulta sobre mi pedido #${orderNumber}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Pedido no encontrado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          No pudimos encontrar el pedido #{orderNumber}
        </p>
        <Button onClick={() => router.push('/mis-ordenes')} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Volver a mis pedidos
        </Button>
      </div>
    );
  }

  const orderStatus = order.status as OrderStatus;
  const statusConfig = getOrderStatusConfig(orderStatus);
  const currentStepIndex = statusOrder[orderStatus];
  const isCancelled = orderStatus === 'cancelled';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/mis-ordenes')}
          className="h-10 w-10 -ml-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Pedido #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </motion.div>

      {/* Status Timeline */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            {isCancelled ? (
              <div className="flex items-center gap-3 text-destructive">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Pedido cancelado</p>
                  {order.cancellationReason && (
                    <p className="text-sm text-muted-foreground">
                      {order.cancellationReason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Current Status */}
                <div className="text-center mb-6">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-sm px-3 py-1',
                      statusConfig.bgColor,
                      statusConfig.textColor
                    )}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Timeline - Horizontal on all screens */}
                <div className="relative">
                  {/* Line */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
                  <div
                    className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                    style={{
                      width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%`,
                    }}
                  />

                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {timelineSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div
                          key={step.status}
                          className="flex flex-col items-center"
                        >
                          <div
                            className={cn(
                              'h-10 w-10 rounded-full flex items-center justify-center border-2 bg-background z-10 transition-colors',
                              isCompleted
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted text-muted-foreground',
                              isCurrent && 'ring-4 ring-primary/20'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span
                            className={cn(
                              'text-[10px] mt-2 text-center max-w-[60px]',
                              isCompleted
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground'
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Products */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {order.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex gap-3 p-4">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.variantSnapshot?.image ? (
                      <Image
                        src={item.variantSnapshot.image}
                        alt={item.variantSnapshot.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">
                      {item.variantSnapshot?.name || 'Producto'}
                    </p>
                    {item.variantSnapshot?.attributes && (
                      <p className="text-xs text-muted-foreground">
                        {Object.values(item.variantSnapshot.attributes).join(' • ')}
                      </p>
                    )}
                    <p className="text-sm mt-1">
                      {item.quantity} × {formatCurrency(item.pricePerUnit)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                    {item.discount > 0 && (
                      <p className="text-xs text-green-600">
                        -{formatCurrency(item.discount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Envío</span>
              <span>
                {order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Gratis'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-lg">{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delivery Info */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{order.customer.name}</p>
              {order.customer.address && (
                <p className="text-sm text-muted-foreground">
                  {order.customer.address.street} {order.customer.address.number}
                  {order.customer.address.neighborhood &&
                    `, ${order.customer.address.neighborhood}`}
                  <br />
                  {order.customer.address.city}
                </p>
              )}
              {order.deliveryNotes && (
                <p className="text-sm text-muted-foreground italic mt-1">
                  Ref: {order.deliveryNotes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer.phone}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>
                {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'} •{' '}
                {order.deliveryMethod === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio'}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="space-y-3 pb-4">
        <Button className="w-full h-12" onClick={handleContactWhatsApp}>
          <MessageCircle className="h-5 w-5 mr-2" />
          Contactar por WhatsApp
        </Button>

        {!isCancelled && (
          <Button variant="outline" className="w-full h-12" onClick={handleReorder}>
            <RefreshCw className="h-5 w-5 mr-2" />
            Volver a pedir
          </Button>
        )}

        {canCancelOrder(order) && (
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => setCancelModalOpen(true)}>
            Cancelar pedido
          </Button>
        )}
      </motion.div>

        {canCancelOrder(order) && (
          <CancelOrderModal
            open={cancelModalOpen}
            onOpenChange={setCancelModalOpen}
            orderNumber={order.orderNumber}
            onCancel={handleCancelOrder}
            isCancelling={isCancelling}
          />
        )}
    </motion.div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center mb-6">
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-12 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-0">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 p-4 border-b last:border-0">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
