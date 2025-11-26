'use client';

import {
  Send,
  CheckCircle,
  ChefHat,
  Truck,
  Package,
  XCircle,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/order';

interface OrderStatusTimelineProps {
  status: OrderStatus;
  cancellationReason?: string;
  variant?: 'full' | 'compact';
  showLabel?: boolean;
  className?: string;
}

// Timeline steps configuration
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

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending_whatsapp: {
    label: 'Enviado por WhatsApp',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  preparing: {
    label: 'En preparación',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  shipped: {
    label: 'En camino',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
  },
  completed: {
    label: 'Entregado',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

export function OrderStatusTimeline({
  status,
  cancellationReason,
  variant = 'full',
  showLabel = true,
  className,
}: OrderStatusTimelineProps) {
  const currentStepIndex = statusOrder[status];
  const isCancelled = status === 'cancelled';
  const config = statusConfig[status];

  // Compact variant - just shows current status badge
  if (variant === 'compact') {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'text-xs px-2 py-0.5',
          config.bgColor,
          config.color,
          className
        )}
      >
        {config.label}
      </Badge>
    );
  }

  // Full variant with timeline
  return (
    <div className={cn('space-y-4', className)}>
      {/* Status Label */}
      {showLabel && (
        <div className="text-center">
          <Badge
            variant="secondary"
            className={cn('text-sm px-3 py-1', config.bgColor, config.color)}
          >
            {config.label}
          </Badge>
        </div>
      )}

      {/* Cancelled State */}
      {isCancelled ? (
        <div className="flex items-center gap-3 text-destructive">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Pedido cancelado</p>
            {cancellationReason && (
              <p className="text-sm text-muted-foreground">{cancellationReason}</p>
            )}
          </div>
        </div>
      ) : (
        /* Timeline - Horizontal */
        <div className="relative">
          {/* Background Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
          {/* Progress Line */}
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
                <div key={step.status} className="flex flex-col items-center">
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
                      isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility to get status configuration
export function getStatusConfig(status: OrderStatus) {
  return statusConfig[status];
}

// Utility to check if order can be cancelled
export function canOrderBeCancelled(status: OrderStatus): boolean {
  return status === 'pending_whatsapp';
}
