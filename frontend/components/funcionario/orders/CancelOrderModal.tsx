'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Order } from '@/types/order';

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onCancel: (data: { reason: string }) => void;
  isCancelling: boolean;
}

export function CancelOrderModal({
  open,
  onOpenChange,
  order,
  onCancel,
  isCancelling,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const handleCancel = () => {
    onCancel({ reason: reason.trim() });

    // If notifyCustomer is checked, open WhatsApp after cancelling
    if (notifyCustomer && order.customer.phone) {
      setTimeout(() => {
        const message = `Hola ${order.customer.name}, lamentamos informarte que tu orden ${order.orderNumber} ha sido cancelada. Motivo: ${reason}. Disculpa las molestias.`;
        window.open(
          `https://wa.me/${order.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
          '_blank'
        );
      }, 500);
    }
  };

  const commonReasons = [
    'Cliente no respondió WhatsApp',
    'Cliente canceló por teléfono',
    'Sin stock disponible',
    'Dirección fuera de zona de cobertura',
    'Orden duplicada',
  ];

  const isValid = reason.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancelar Orden {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El stock será restaurado automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta acción es <strong>irreversible</strong>. La orden pasará a estado cancelado permanentemente.
            </AlertDescription>
          </Alert>

          {/* Order Info */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-1">
            <p className="text-sm"><strong>Cliente:</strong> {order.customer.name}</p>
            <p className="text-sm"><strong>Total:</strong> {formatCurrency(order.total)}</p>
            <p className="text-sm"><strong>Estado actual:</strong> {getStatusLabel(order.status)}</p>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo de cancelación (requerido) <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ingrese el motivo de la cancelación (mínimo 10 caracteres)"
              rows={4}
              maxLength={500}
              className={!isValid && reason.length > 0 ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-xs">
              <span className={!isValid && reason.length > 0 ? 'text-red-600' : 'text-slate-500'}>
                {isValid ? '✓ Válido' : `Mínimo 10 caracteres (${reason.length}/10)`}
              </span>
              <span className="text-slate-500">{reason.length}/500</span>
            </div>
          </div>

          {/* Common Reasons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Motivos comunes:
            </p>
            <div className="flex flex-wrap gap-2">
              {commonReasons.map((commonReason) => (
                <Button
                  key={commonReason}
                  variant="outline"
                  size="sm"
                  onClick={() => setReason(commonReason)}
                  type="button"
                  className="text-xs"
                >
                  {commonReason}
                </Button>
              ))}
            </div>
          </div>

          {/* Auto-actions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Acciones automáticas:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>✓ El stock será restaurado automáticamente</li>
              <li>✓ La orden cambiará a estado "Cancelada"</li>
              <li>✓ Se registrará el motivo y fecha de cancelación</li>
            </ul>
          </div>

          {/* Notify Customer Checkbox */}
          {order.customer.phone && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyCustomer"
                checked={notifyCustomer}
                onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
              />
              <label
                htmlFor="notifyCustomer"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Notificar al cliente por WhatsApp
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
          >
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling || !isValid}
            className="gap-2"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Cancelar Orden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' Gs';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_whatsapp: 'Pendiente WhatsApp',
    confirmed: 'Confirmada',
    preparing: 'En Preparación',
    shipped: 'Enviada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  return labels[status] || status;
}
