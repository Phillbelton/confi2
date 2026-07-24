'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OrderItemsEditor } from '@/components/orders/OrderItemsEditor';
import { funcionarioOrdersService } from '@/services/funcionario/orders';
import type { Order, EditOrderItemsData } from '@/types/order';

interface EditOrderItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSave: (data: EditOrderItemsData) => void;
  isSaving?: boolean;
}

/**
 * Edición de los productos de un pedido (superficie funcionario). Reusa el
 * editor compartido; solo cambia el cliente de preview (funcionario).
 */
export function EditOrderItemsModal({
  open,
  onOpenChange,
  order,
  onSave,
  isSaving,
}: EditOrderItemsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar productos del pedido</DialogTitle>
        </DialogHeader>
        {/* Montado sólo con la modal abierta y re-montado por pedido (key), así
            el estado del editor arranca siempre desde el pedido actual. */}
        {open && (
          <OrderItemsEditor
            key={order._id}
            order={order}
            previewFn={funcionarioOrdersService.previewOrderItems}
            isSaving={isSaving}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
