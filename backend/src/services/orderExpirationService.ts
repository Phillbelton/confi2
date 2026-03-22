/**
 * Order Expiration Service
 *
 * Cancela automáticamente las órdenes de invitados que llevan
 * más de X horas en estado pending_whatsapp sin ser confirmadas.
 *
 * - Solo afecta órdenes de invitados (sin customer.user)
 * - Las órdenes de usuarios registrados NO expiran
 * - El stock se restaura automáticamente via el pre-save hook del modelo Order
 * - Las órdenes canceladas permanecen en la base de datos como registro histórico
 */

import cron from 'node-cron';
import { Order } from '../models/Order';
import { ENV } from '../config/env';
import logger from '../config/logger';

const EXPIRATION_REASON = 'Orden expirada automáticamente — sin confirmación en el plazo establecido';

/**
 * Busca y cancela órdenes de invitados expiradas.
 * Retorna la cantidad de órdenes canceladas.
 */
export async function cancelExpiredGuestOrders(): Promise<number> {
  const expirationHours = ENV.ORDER_EXPIRATION_HOURS;
  const cutoffDate = new Date(Date.now() - expirationHours * 60 * 60 * 1000);

  // Buscar órdenes de invitados en pending_whatsapp creadas antes del corte
  // $exists: false matchea campos undefined (no seteados en el documento)
  const expiredOrders = await Order.find({
    status: 'pending_whatsapp',
    'customer.user': { $exists: false },
    createdAt: { $lt: cutoffDate },
  });

  if (expiredOrders.length === 0) {
    return 0;
  }

  let cancelledCount = 0;

  for (const order of expiredOrders) {
    try {
      order.status = 'cancelled';
      order.cancellationReason = EXPIRATION_REASON;
      // El pre-save hook restaura el stock automáticamente
      await order.save();
      cancelledCount++;

      logger.info('Orden de invitado expirada cancelada', {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerPhone: order.customer.phone,
      });
    } catch (error) {
      logger.error('Error cancelando orden expirada', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return cancelledCount;
}

/**
 * Inicia el cron job de expiración de órdenes.
 * Ejecuta cada 30 minutos.
 * No se inicia en entorno de test.
 */
export function startOrderExpirationScheduler(): void {
  if (ENV.NODE_ENV === 'test') {
    return;
  }

  // Cada 30 minutos: */30 * * * *
  cron.schedule('*/30 * * * *', async () => {
    try {
      const cancelled = await cancelExpiredGuestOrders();

      if (cancelled > 0) {
        logger.info(`⏰ Expiración automática: ${cancelled} orden(es) de invitado cancelada(s)`);
      }
    } catch (error) {
      logger.error('Error en scheduler de expiración de órdenes', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  logger.info(
    `⏰ Scheduler de expiración iniciado — órdenes de invitados expiran tras ${ENV.ORDER_EXPIRATION_HOURS}h sin confirmación`
  );
}
