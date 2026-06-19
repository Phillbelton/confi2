import type { Order } from '@/types/order';

/** Umbral para considerar un pedido "urgente" (pendiente de contacto). */
export const URGENT_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Un pedido es "urgente" cuando sigue en `pending_whatsapp` (sin contactar al
 * cliente) más de 2 horas desde que se creó. Se usa para resaltarlo en las
 * tablas y el detalle (admin y funcionario) y priorizar la atención.
 */
export function isOrderUrgent(
  order: Pick<Order, 'status' | 'createdAt'>
): boolean {
  return (
    order.status === 'pending_whatsapp' &&
    Date.now() - new Date(order.createdAt).getTime() > URGENT_THRESHOLD_MS
  );
}
