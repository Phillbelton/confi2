import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order, OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  order: Order;
}

const statusFlow: OrderStatus[] = [
  'pending_whatsapp',
  'confirmed',
  'preparing',
  'shipped',
  'completed',
];

const statusLabels = {
  pending_whatsapp: 'Pendiente WhatsApp',
  confirmed: 'Confirmada',
  preparing: 'En Preparación',
  shipped: 'Enviada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export function OrderTimeline({ order }: OrderTimelineProps) {
  const currentStatusIndex = statusFlow.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Created */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <CheckCircle className="h-5 w-5 text-green-600 fill-green-100 dark:fill-green-900/30" />
              <div className="w-px h-full bg-slate-200 dark:bg-slate-700 mt-1" />
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium text-sm">Orden Creada</p>
              <p className="text-xs text-slate-500">
                {format(new Date(order.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                  locale: es,
                })}
              </p>
              {order.createdBy && (
                <p className="text-xs text-slate-500">Por: Sistema (Cliente Online)</p>
              )}
            </div>
          </div>

          {/* WhatsApp Sent */}
          {order.whatsappSent && order.whatsappSentAt && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <CheckCircle className="h-5 w-5 text-green-600 fill-green-100 dark:fill-green-900/30" />
                <div className="w-px h-full bg-slate-200 dark:bg-slate-700 mt-1" />
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium text-sm">WhatsApp Enviado</p>
                <p className="text-xs text-slate-500">
                  {format(new Date(order.whatsappSentAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                    locale: es,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          {!isCancelled ? (
            statusFlow.map((status, index) => {
              const isPast = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const isFuture = index > currentStatusIndex;

              // Get timestamp for this status
              let timestamp: Date | null = null;
              if (status === 'confirmed' && order.confirmedAt) {
                timestamp = new Date(order.confirmedAt);
              } else if (status === 'completed' && order.completedAt) {
                timestamp = new Date(order.completedAt);
              }

              return (
                <div key={status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {isPast ? (
                      <CheckCircle className="h-5 w-5 text-green-600 fill-green-100 dark:fill-green-900/30" />
                    ) : isCurrent ? (
                      <Clock className="h-5 w-5 text-blue-600 fill-blue-100 dark:fill-blue-900/30" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                    {index < statusFlow.length - 1 && (
                      <div
                        className={cn(
                          'w-px h-full mt-1',
                          isPast
                            ? 'bg-green-200 dark:bg-green-800'
                            : 'bg-slate-200 dark:bg-slate-700'
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p
                      className={cn(
                        'font-medium text-sm',
                        isCurrent && 'text-blue-600 dark:text-blue-400',
                        isFuture && 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {statusLabels[status]}
                    </p>
                    {timestamp && (
                      <p className="text-xs text-slate-500">
                        {format(timestamp, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    )}
                    {isCurrent && !timestamp && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">Estado actual</p>
                    )}
                    {isFuture && (
                      <p className="text-xs text-slate-400">Pendiente</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            /* Cancelled */
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <Circle className="h-5 w-5 text-red-600 fill-red-100 dark:fill-red-900/30" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-red-600 dark:text-red-400">Cancelada</p>
                {order.cancelledAt && (
                  <p className="text-xs text-slate-500">
                    {format(new Date(order.cancelledAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </p>
                )}
                {order.cancellationReason && (
                  <div className="mt-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-2">
                    <p className="text-xs font-medium text-red-900 dark:text-red-100">
                      Motivo:
                    </p>
                    <p className="text-xs text-red-800 dark:text-red-200">
                      {order.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
