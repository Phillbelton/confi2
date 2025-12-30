'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFuncionarioOrders } from '@/hooks/funcionario/useFuncionarioOrders';
import { Eye, MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';

export default function PendientesPage() {
  const { orders, isLoading, markWhatsAppSent } = useFuncionarioOrders({
    status: 'pending_whatsapp',
    page: 1,
    limit: 50, // Show more on this page since it's focused
  });

  const handleOpenWhatsApp = (orderId: string, phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
    // Automatically mark as sent
    markWhatsAppSent({ id: orderId });
  };

  const getPriorityBadge = (createdAt: string | Date) => {
    const hours = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

    if (hours > 24) {
      return {
        label: '🚨 Muy Urgente',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      };
    } else if (hours > 2) {
      return {
        label: '⏰ Urgente',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      };
    } else {
      return {
        label: '🆕 Nueva',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Órdenes Pendientes</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Órdenes Pendientes</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Órdenes esperando confirmación por WhatsApp ({orders.length})
        </p>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">¡Todo al día!</h3>
              <p className="text-slate-500">No hay órdenes pendientes de confirmación</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const priority = getPriorityBadge(order.createdAt);
          const hours = (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
          const isVeryUrgent = hours > 24;
          const isUrgent = hours > 2;

          return (
            <Card
              key={order._id}
              className={cn(
                'hover:shadow-md transition-shadow',
                isVeryUrgent && 'border-red-500 border-2',
                isUrgent && !isVeryUrgent && 'border-orange-500 border-l-4'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-mono">
                      {order.orderNumber}
                    </CardTitle>
                    <Badge className={priority.className}>{priority.label}</Badge>
                  </div>
                  <span className="text-sm text-slate-500">
                    {formatDistanceToNow(new Date(order.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Cliente</p>
                    <p className="font-semibold">{order.customer.name}</p>
                    <p className="text-sm text-slate-600">{order.customer.phone}</p>
                    {order.customer.email && (
                      <p className="text-xs text-slate-500">{order.customer.email}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Detalles</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {formatCurrency(order.total)}
                      </Badge>
                      <Badge variant="outline">
                        {order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '📦 Retiro'}
                      </Badge>
                      <Badge variant="outline">
                        {order.paymentMethod === 'cash' ? '💵 Efectivo' : '💳 Transfer.'}
                      </Badge>
                      <Badge variant="outline">
                        📦 {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Products Summary */}
                <div>
                  <p className="text-sm text-slate-500 mb-2">Productos</p>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-sm">
                        • {item.quantity}x {item.variantSnapshot.name}
                      </p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-slate-500">
                        +{order.items.length - 3} producto(s) más
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Notes */}
                {order.customerNotes && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                      💬 Nota del cliente:
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {order.customerNotes}
                    </p>
                  </div>
                )}

                {/* WhatsApp Status */}
                {order.whatsappSent && order.whatsappSentAt && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      WhatsApp enviado{' '}
                      {formatDistanceToNow(new Date(order.whatsappSentAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    className="flex-1 md:flex-none gap-2"
                    onClick={() => handleOpenWhatsApp(order._id, order.customer.phone)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {order.whatsappSent ? 'Volver a enviar' : 'Enviar'} WhatsApp
                  </Button>

                  <Link href={`/funcionario/ordenes/${order._id}`} className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Detalle
                    </Button>
                  </Link>

                  <Link href={`/funcionario/ordenes/${order._id}`} className="flex-1 md:flex-none">
                    <Button variant="default" className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="h-4 w-4" />
                      Confirmar Orden
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help */}
      {orders.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">Consejos para gestionar pendientes:</p>
                <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                  <li>• Prioriza las órdenes más antiguas (marcadas como urgentes)</li>
                  <li>• Envía el WhatsApp para confirmar disponibilidad</li>
                  <li>• Una vez confirmado por el cliente, haz clic en "Confirmar Orden"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
