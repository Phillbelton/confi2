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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Order, OrderStatus } from '@/types/order';

interface UpdateStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onUpdate: (data: { status: OrderStatus; adminNotes?: string }) => void;
  isUpdating: boolean;
}

const statusOptions: { value: OrderStatus; label: string; description: string }[] = [
  {
    value: 'pending_whatsapp',
    label: '🟡 Pendiente WhatsApp',
    description: 'Cliente debe confirmar por WhatsApp',
  },
  {
    value: 'confirmed',
    label: '🔵 Confirmada',
    description: 'Cliente confirmó, listo para preparar',
  },
  {
    value: 'preparing',
    label: '🟣 En Preparación',
    description: 'Empacando el pedido',
  },
  {
    value: 'shipped',
    label: '🟦 Enviada',
    description: 'En camino al cliente',
  },
  {
    value: 'completed',
    label: '🟢 Completada',
    description: 'Cliente recibió el producto',
  },
];

export function UpdateStatusModal({
  open,
  onOpenChange,
  order,
  onUpdate,
  isUpdating,
}: UpdateStatusModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const [adminNotes, setAdminNotes] = useState('');

  const handleUpdate = () => {
    onUpdate({
      status: newStatus,
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  const currentStatusOption = statusOptions.find((s) => s.value === order.status);
  const newStatusOption = statusOptions.find((s) => s.value === newStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Actualizar Estado de Orden</DialogTitle>
          <DialogDescription>
            Orden {order.orderNumber} • Cliente: {order.customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <p className="text-sm font-medium mb-1">Estado actual:</p>
            <p className="text-base font-semibold">{currentStatusOption?.label}</p>
            <p className="text-xs text-slate-500">{currentStatusOption?.description}</p>
          </div>

          {/* New Status Selector */}
          <div className="space-y-2">
            <Label htmlFor="newStatus">Nuevo estado</Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
              <SelectTrigger id="newStatus">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value === order.status}
                  >
                    <div className="flex flex-col items-start">
                      <span>{option.label}</span>
                      <span className="text-xs text-slate-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Change Preview */}
          {newStatus !== order.status && (
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <span className="font-semibold">{currentStatusOption?.label}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-semibold">{newStatusOption?.label}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Notas administrativas (opcional)</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ej: Cliente pidió cambio de dirección, se actualizó manualmente"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-slate-500">{adminNotes.length}/1000 caracteres</p>
          </div>

          {/* Help Panel */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Flujo recomendado:
            </p>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p>1️⃣ <strong>Pendiente WhatsApp</strong> → Cliente crea orden</p>
              <p>2️⃣ <strong>Confirmada</strong> → Cliente confirmó por WhatsApp</p>
              <p>3️⃣ <strong>En Preparación</strong> → Empacando el pedido</p>
              <p>4️⃣ <strong>Enviada</strong> → En camino al cliente</p>
              <p>5️⃣ <strong>Completada</strong> → Cliente recibió conforme</p>
            </div>
          </div>

          {/* Special State Warnings */}
          {newStatus === 'completed' && (
            <Alert>
              <AlertDescription className="text-sm">
                ⚠️ Al marcar como <strong>Completada</strong>, la orden se considera finalizada y no se podrá editar.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || newStatus === order.status}
            className="gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Actualizar Estado
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
