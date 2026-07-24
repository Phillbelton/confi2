'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderItemsEditor } from '@/components/orders/OrderItemsEditor';
import { useAdminOrders } from '@/hooks/admin/useAdminOrders';
import { adminOrdersService } from '@/services/admin/orders';
import type { Order } from '@/types/order';

interface EditOrderItemsProps {
  order: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Edición de los productos de un pedido (superficie admin). La lógica vive en
 * el editor compartido; acá solo se conectan la mutación y el preview del
 * cliente admin.
 */
export function EditOrderItems({ order, onSuccess, onCancel }: EditOrderItemsProps) {
  const { editOrderItems, isEditingItems } = useAdminOrders({ page: 1, limit: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Editar productos del pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <OrderItemsEditor
          order={order}
          previewFn={adminOrdersService.previewOrderItems}
          isSaving={isEditingItems}
          onCancel={() => onCancel?.()}
          onSave={(data) =>
            editOrderItems({ id: order._id, data }, { onSuccess: () => onSuccess?.() })
          }
        />
      </CardContent>
    </Card>
  );
}
