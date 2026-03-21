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
import { AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  onCancel: (reason: string) => void;
  isCancelling: boolean;
}

export function CancelOrderModal({
  open,
  onOpenChange,
  orderNumber,
  onCancel,
  isCancelling,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');

  const handleCancel = () => {
    if (reason.trim().length >= 10) {
      onCancel(reason.trim());
    }
  };

  const commonReasons = [
    'Ya no necesito el producto',
    'Encontré un mejor precio',
    'Me equivoqué en el pedido',
    'Tardará demasiado en llegar',
    'Cambié de opinión',
  ];

  const isValid = reason.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancelar Pedido {orderNumber}
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Una vez cancelado, no podrás recuperar este pedido. Deberás realizar uno nuevo.
            </AlertDescription>
          </Alert>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo de cancelación <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Por favor cuéntanos por qué cancelas tu pedido (mínimo 10 caracteres)"
              rows={4}
              maxLength={500}
              className={!isValid && reason.length > 0 ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-xs">
              <span className={!isValid && reason.length > 0 ? 'text-red-600' : 'text-muted-foreground'}>
                {isValid ? '✓ Válido' : `Mínimo 10 caracteres (${reason.length}/10)`}
              </span>
              <span className="text-muted-foreground">{reason.length}/500</span>
            </div>
          </div>

          {/* Common Reasons */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Motivos comunes:</p>
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

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Importante:</strong> El stock será restaurado automáticamente y recibirás una
              confirmación por correo electrónico.
            </p>
          </div>
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
                Confirmar Cancelación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
