import {
  createTestUser,
  generateAuthToken,
  createTestProductVariant,
  createTestOrder,
} from '../setup/testUtils';
import { Order } from '../../models/Order';
import ProductVariant from '../../models/ProductVariant';
import { cancelExpiredGuestOrders } from '../../services/orderExpirationService';
import mongoose from 'mongoose';

/**
 * Order Expiration Service Tests
 *
 * Tests the auto-cancellation of expired guest orders.
 * Uses cancelExpiredGuestOrders() directly (not the cron scheduler).
 */

// Helper: create a guest order directly in DB with a backdated createdAt
async function createGuestOrder(data: {
  variantId: any;
  quantity: number;
  hoursAgo: number;
  status?: string;
}) {
  const variant = await ProductVariant.findById(data.variantId);
  if (!variant) throw new Error('Variant not found');

  const order = await Order.create({
    customer: {
      // No user field — this is a guest order
      name: 'Guest Test',
      email: 'guest@test.com',
      phone: '595981999888',
      address: {
        street: 'Test Street',
        number: '123',
        city: 'Santiago',
      },
    },
    items: [
      {
        variant: variant._id,
        variantSnapshot: {
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          attributes: variant.attributes,
          image: variant.images[0] || '',
        },
        quantity: data.quantity,
        pricePerUnit: variant.price,
        discount: 0,
        subtotal: variant.price * data.quantity,
      },
    ],
    subtotal: variant.price * data.quantity,
    totalDiscount: 0,
    shippingCost: 0,
    total: variant.price * data.quantity,
    deliveryMethod: 'delivery',
    paymentMethod: 'cash',
    status: data.status || 'pending_whatsapp',
    whatsappSent: false,
  });

  // Backdate the order — use collection directly to bypass Mongoose timestamps
  const backdatedDate = new Date(Date.now() - data.hoursAgo * 60 * 60 * 1000);
  await Order.collection.updateOne(
    { _id: order._id },
    { $set: { createdAt: backdatedDate } }
  );

  return order;
}

describe('Order Expiration Service', () => {
  describe('cancelExpiredGuestOrders', () => {
    it('should cancel guest order older than 48 hours in pending_whatsapp', async () => {
      const variant = await createTestProductVariant({ price: 10000 });

      const order = await createGuestOrder({
        variantId: variant._id,
        quantity: 2,
        hoursAgo: 50, // 50 hours ago — past the 48h threshold
      });

      const cancelled = await cancelExpiredGuestOrders();

      expect(cancelled).toBe(1);

      // Verify order is cancelled
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.status).toBe('cancelled');
      expect(updatedOrder?.cancellationReason).toContain('expirada automáticamente');
      expect(updatedOrder?.cancelledAt).toBeDefined();
    });

    it('should NOT cancel guest order younger than 48 hours', async () => {
      const variant = await createTestProductVariant({ price: 10000 });

      const order = await createGuestOrder({
        variantId: variant._id,
        quantity: 2,
        hoursAgo: 24, // Only 24 hours — not yet expired
      });

      const cancelled = await cancelExpiredGuestOrders();

      expect(cancelled).toBe(0);

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.status).toBe('pending_whatsapp');
    });

    it('should NOT cancel registered user order even if older than 48h', async () => {
      const user = await createTestUser();
      const variant = await createTestProductVariant({ price: 10000 });

      const order = await createTestOrder({
        user,
        items: [{ variantId: variant._id, quantity: 2 }],
        status: 'pending_whatsapp',
      });

      // Backdate to 72 hours ago — use collection directly to bypass timestamps
      await Order.collection.updateOne(
        { _id: order._id },
        { $set: { createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000) } }
      );

      const cancelled = await cancelExpiredGuestOrders();

      expect(cancelled).toBe(0);

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.status).toBe('pending_whatsapp');
    });

    it('should NOT cancel guest order already confirmed', async () => {
      const variant = await createTestProductVariant({ price: 10000 });

      const order = await createGuestOrder({
        variantId: variant._id,
        quantity: 2,
        hoursAgo: 72,
        status: 'confirmed', // Already confirmed
      });

      const cancelled = await cancelExpiredGuestOrders();

      expect(cancelled).toBe(0);

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.status).toBe('confirmed');
    });

    it('should cancel multiple expired guest orders at once', async () => {
      const variant = await createTestProductVariant({ price: 5000 });

      await createGuestOrder({ variantId: variant._id, quantity: 3, hoursAgo: 50 });
      await createGuestOrder({ variantId: variant._id, quantity: 5, hoursAgo: 60 });
      await createGuestOrder({ variantId: variant._id, quantity: 2, hoursAgo: 72 });

      const cancelled = await cancelExpiredGuestOrders();

      expect(cancelled).toBe(3);
    });

    it('should only cancel expired ones, leaving recent orders untouched', async () => {
      const variant = await createTestProductVariant({ price: 10000 });

      // Old — should be cancelled
      await createGuestOrder({ variantId: variant._id, quantity: 5, hoursAgo: 50 });
      // Recent — should be kept
      await createGuestOrder({ variantId: variant._id, quantity: 3, hoursAgo: 12 });

      const cancelled = await cancelExpiredGuestOrders();

      expect(cancelled).toBe(1);
    });

    it('should return 0 when no orders need cancellation', async () => {
      const cancelled = await cancelExpiredGuestOrders();
      expect(cancelled).toBe(0);
    });

    it('should preserve order data after cancellation (historical record)', async () => {
      const variant = await createTestProductVariant({ price: 15000 });

      const order = await createGuestOrder({
        variantId: variant._id,
        quantity: 4,
        hoursAgo: 50,
      });

      await cancelExpiredGuestOrders();

      const cancelledOrder = await Order.findById(order._id);
      expect(cancelledOrder).not.toBeNull();
      expect(cancelledOrder?.status).toBe('cancelled');
      expect(cancelledOrder?.customer.name).toBe('Guest Test');
      expect(cancelledOrder?.customer.email).toBe('guest@test.com');
      expect(cancelledOrder?.items).toHaveLength(1);
      expect(cancelledOrder?.items[0].quantity).toBe(4);
      expect(cancelledOrder?.total).toBe(60000);
      expect(cancelledOrder?.orderNumber).toBeDefined();
    });
  });
});
