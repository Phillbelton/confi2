import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/types/order';

const statusConfig = {
  pending_whatsapp: {
    label: '🟡 Pendiente WhatsApp',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  confirmed: {
    label: '🔵 Confirmada',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  preparing: {
    label: '🟣 En Preparación',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  shipped: {
    label: '🟦 Enviada',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  completed: {
    label: '🟢 Completada',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  cancelled: {
    label: '🔴 Cancelada',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}
