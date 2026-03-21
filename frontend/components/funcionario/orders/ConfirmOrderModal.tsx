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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Loader2 } from 'lucide-react';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/lib/utils';

interface ConfirmOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onConfirm: (data: { shippingCost: number; adminNotes?: string }) => void;
  isConfirming: boolean;
}

export function ConfirmOrderModal({
  open,
  onOpenChange,
  order,
  onConfirm,
  isConfirming,
}: ConfirmOrderModalProps) {
  const [shippingCost, setShippingCost] = useState('0');
  const [adminNotes, setAdminNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const newTotal = order.subtotal + parseInt(shippingCost || '0');

  const handleConfirm = () => {
    onConfirm({
      shippingCost: parseInt(shippingCost),
      adminNotes: adminNotes.trim() || undefined,
    });

    // If sendWhatsApp is checked, open WhatsApp after confirming
    if (sendWhatsApp && order.customer.phone) {
      setTimeout(() => {
        window.open(
          `https://wa.me/${order.customer.phone.replace(/\D/g, '')}`,
          '_blank'
        );
      }, 500);
    }
  };

  const quickAmounts = [
    { label: 'Gratis', value: 0 },
    { label: '10.000 Gs', value: 10000 },
    { label: '15.000 Gs', value: 15000 },
    { label: '20.000 Gs', value: 20000 },
    { label: '25.000 Gs', value: 25000 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirmar Orden {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Confirma la orden del cliente. El costo de envío se puede calcular y agregar después.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <p className="text-sm font-medium mb-1">Cliente:</p>
            <p className="text-sm">{order.customer.name}</p>
            <p className="text-xs text-slate-500">{order.customer.phone}</p>
          </div>

          {/* Current Total */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Total actual (sin envío):</span>
            <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
          </div>

          {/* Shipping Cost Input */}
          <div className="space-y-2">
            <Label htmlFor="shippingCost">Costo de envío (opcional)</Label>
            <Input
              id="shippingCost"
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              placeholder="Ingrese el costo de envío"
              min="0"
              step="1000"
              className="text-right"
            />
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setShippingCost(amount.value.toString())}
                  type="button"
                >
                  {amount.label}
                </Button>
              ))}
            </div>
          </div>

          {/* New Total */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Nuevo total:</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(newTotal)}
              </span>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Notas administrativas (opcional)</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ej: Cliente confirmó por WhatsApp a las 10:30"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-slate-500">{adminNotes.length}/1000 caracteres</p>
          </div>

          {/* Send WhatsApp Checkbox */}
          {order.customer.phone && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendWhatsApp"
                checked={sendWhatsApp}
                onCheckedChange={(checked) => setSendWhatsApp(checked as boolean)}
              />
              <label
                htmlFor="sendWhatsApp"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enviar mensaje de confirmación por WhatsApp
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || !shippingCost}
            className="gap-2"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmar Orden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
