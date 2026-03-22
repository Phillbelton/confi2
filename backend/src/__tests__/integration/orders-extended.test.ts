import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestProductVariant,
  createTestOrder,
} from '../setup/testUtils';
import { Order } from '../../models/Order';
import ProductVariant from '../../models/ProductVariant';
import StockMovementModel from '../../models/StockMovement';

const StockMovement = StockMovementModel;

// ═══════════════════════════════════════════════════════════════════════════
// EXTENDED ORDERS TEST SUITE
// Covers: validate-cart, edit items, update shipping, tiered discounts,
//         edge cases, status flow, and the check-phone endpoint.
// ═══════════════════════════════════════════════════════════════════════════

describe('Orders API — Extended', () => {
  // ─── POST /api/orders/validate-cart ───────────────────────────────────
  describe('POST /api/orders/validate-cart', () => {
    it('should validate cart with correct prices', async () => {
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      const response = await request(app)
        .post('/api/orders/validate-cart')
        .send({
          items: [
            {
              variantId: variant._id.toString(),
              quantity: 3,
              finalPrice: 10000,
              subtotal: 30000,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].originalPrice).toBe(10000);
      expect(response.body.data.items[0].finalPricePerUnit).toBe(10000);
    });

    it('should detect price discrepancy (anti-fraud)', async () => {
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      const response = await request(app)
        .post('/api/orders/validate-cart')
        .send({
          items: [
            {
              variantId: variant._id.toString(),
              quantity: 2,
              finalPrice: 5000, // Tampered price
              subtotal: 10000,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.discrepancies).toHaveLength(1);
      expect(response.body.data.serverPrices).toBeDefined();
      expect(response.body.data.serverPrices[0].finalPricePerUnit).toBe(10000);
    });

    it('should validate cart with fixed discount applied', async () => {
      const variant = await createTestProductVariant({ price: 20000, stock: 50 });
      variant.fixedDiscount = {
        type: 'percentage',
        value: 25, // 25% off → 15000
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        enabled: true,
      };
      await variant.save();

      const response = await request(app)
        .post('/api/orders/validate-cart')
        .send({
          items: [
            {
              variantId: variant._id.toString(),
              quantity: 1,
              finalPrice: 15000,
              subtotal: 15000,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.items[0].finalPricePerUnit).toBe(15000);
      expect(response.body.data.items[0].totalDiscount).toBe(5000);
    });

    it('should reject empty cart', async () => {
      const response = await request(app)
        .post('/api/orders/validate-cart')
        .send({ items: [] });

      expect(response.status).toBe(400);
    });

    it('should reject missing items field', async () => {
      const response = await request(app)
        .post('/api/orders/validate-cart')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should validate cart with multiple items', async () => {
      const v1 = await createTestProductVariant({ price: 5000, stock: 50 });
      const v2 = await createTestProductVariant({ price: 8000, stock: 50 });

      const response = await request(app)
        .post('/api/orders/validate-cart')
        .send({
          items: [
            { variantId: v1._id.toString(), quantity: 2, finalPrice: 5000, subtotal: 10000 },
            { variantId: v2._id.toString(), quantity: 1, finalPrice: 8000, subtotal: 8000 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
    });
  });

  // ─── PUT /api/orders/:id/items (edit order items) ────────────────────
  describe('PUT /api/orders/:id/items', () => {
    it('should add a new item to existing order', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const v1 = await createTestProductVariant({ price: 10000, stock: 50 });
      const v2 = await createTestProductVariant({ price: 8000, stock: 40 });

      const order = await createTestOrder({
        user: admin,
        items: [{ variantId: v1._id, quantity: 2 }],
        status: 'confirmed',
      });

      // Stock after order: v1=48
      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [
            { variantId: v1._id.toString(), quantity: 2 },
            { variantId: v2._id.toString(), quantity: 3 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order.items).toHaveLength(2);

      // v2 stock should be deducted by 3
      const updatedV2 = await ProductVariant.findById(v2._id);
      expect(updatedV2?.stock).toBe(37);

      // Should have stock change records
      expect(response.body.data.stockChanges).toBeDefined();
    });

    it('should increase quantity of existing item', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const variant = await createTestProductVariant({ price: 5000, stock: 50 });

      const order = await createTestOrder({
        items: [{ variantId: variant._id, quantity: 2 }],
        status: 'pending_whatsapp',
      });

      // Stock after order: 48
      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id.toString(), quantity: 5 }],
          adminNotes: 'Client requested 3 more',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.order.items[0].quantity).toBe(5);

      // Stock should be 48 - 3 (additional) = 45
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(45);
    });

    it('should decrease quantity and restore stock', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      const order = await createTestOrder({
        items: [{ variantId: variant._id, quantity: 10 }],
        status: 'confirmed',
      });

      // Stock after order: 40
      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id.toString(), quantity: 3 }],
        });

      expect(response.status).toBe(200);

      // Stock should be restored: 40 + 7 = 47
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(47);
    });

    it('should remove an item and restore its full stock', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const v1 = await createTestProductVariant({ price: 10000, stock: 50 });
      const v2 = await createTestProductVariant({ price: 5000, stock: 30 });

      const order = await createTestOrder({
        items: [
          { variantId: v1._id, quantity: 2 },
          { variantId: v2._id, quantity: 4 },
        ],
        status: 'preparing',
      });

      // v1: 48, v2: 26
      // Send only v1, effectively removing v2
      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: v1._id.toString(), quantity: 2 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.order.items).toHaveLength(1);

      // v2 should have stock fully restored
      const updatedV2 = await ProductVariant.findById(v2._id);
      expect(updatedV2?.stock).toBe(30);
    });

    it('should reject editing completed order', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ stock: 50 });
      const order = await createTestOrder({
        items: [{ variantId: variant._id, quantity: 1 }],
        status: 'completed',
      });

      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id.toString(), quantity: 3 }],
        });

      expect(response.status).toBe(400);
    });

    it('should reject editing cancelled order', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ stock: 50 });
      const order = await createTestOrder({
        items: [{ variantId: variant._id, quantity: 1 }],
        status: 'cancelled',
      });

      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id.toString(), quantity: 3 }],
        });

      expect(response.status).toBe(400);
    });

    it('should reject editing as cliente', async () => {
      const cliente = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(cliente);
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(403);
    });

    it('should reject when new item has insufficient stock', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ price: 10000, stock: 5 });

      const order = await createTestOrder({
        items: [{ variantId: variant._id, quantity: 2 }],
        status: 'confirmed',
      });

      // Try to increase to more than available stock (stock=3 after initial deduction)
      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id.toString(), quantity: 10 }],
        });

      expect(response.status).toBe(400);
    });

    it('should recalculate totals correctly after edit', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ price: 10000, stock: 100 });

      const order = await createTestOrder({
        items: [{ variantId: variant._id, quantity: 2 }],
        status: 'confirmed',
      });

      // Confirm order with shipping cost first
      await request(app)
        .put(`/api/orders/${order._id}/shipping`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 5000 });

      // Now edit items
      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id.toString(), quantity: 4 }],
        });

      expect(response.status).toBe(200);
      // subtotal should be 4 * 10000 = 40000, total = 40000 + 5000 = 45000
      expect(response.body.data.order.subtotal).toBe(40000);
      expect(response.body.data.order.total).toBe(45000);
    });

    it('should return whatsapp data after edit', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ price: 10000, stock: 100 });

      const order = await createTestOrder({
        items: [{ variantId: variant._id, quantity: 2 }],
        status: 'confirmed',
      });

      const response = await request(app)
        .put(`/api/orders/${order._id}/items`)
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id.toString(), quantity: 3 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.whatsappMessage).toBeDefined();
      expect(typeof response.body.data.whatsappMessage).toBe('string');
    });
  });

  // ─── PUT /api/orders/:id/shipping ────────────────────────────────────
  describe('PUT /api/orders/:id/shipping', () => {
    it('should update shipping cost and recalculate total', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/shipping`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 12000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.shippingCost).toBe(12000);
      expect(response.body.data.total).toBe(order.subtotal + 12000);
    });

    it('should allow setting shipping cost to zero (free shipping)', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/shipping`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 0 });

      expect(response.status).toBe(200);
      expect(response.body.data.shippingCost).toBe(0);
      expect(response.body.data.total).toBe(order.subtotal);
    });

    it('should reject negative shipping cost', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/shipping`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: -1000 });

      expect(response.status).toBe(400);
    });

    it('should reject updating shipping on completed order', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'completed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/shipping`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 5000 });

      expect(response.status).toBe(400);
    });

    it('should reject updating shipping on cancelled order', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'cancelled' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/shipping`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 5000 });

      expect(response.status).toBe(400);
    });

    it('should reject as cliente', async () => {
      const cliente = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(cliente);
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/shipping`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 5000 });

      expect(response.status).toBe(403);
    });

    it('should reject without authentication', async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .put(`/api/orders/${order._id}/shipping`)
        .send({ shippingCost: 5000 });

      expect(response.status).toBe(401);
    });
  });

  // ─── Tiered Discounts in Orders ──────────────────────────────────────
  describe('Tiered discounts in orders', () => {
    it('should apply tiered discount when quantity threshold met', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 100 });

      // Add tiered discount: buy 5+, get 10% off
      variant.tieredDiscount = {
        active: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        tiers: [
          { minQuantity: 5, maxQuantity: null, type: 'percentage', value: 10 },
        ],
      };
      await variant.save();

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 5 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      const orderItem = response.body.data.order.items[0];
      // 10000 - 10% = 9000 per unit
      expect(orderItem.pricePerUnit).toBe(9000);
      expect(orderItem.subtotal).toBe(45000);
    });

    it('should NOT apply tiered discount when below threshold', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 100 });

      variant.tieredDiscount = {
        active: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        tiers: [
          { minQuantity: 10, maxQuantity: null, type: 'percentage', value: 15 },
        ],
      };
      await variant.save();

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 3 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      const orderItem = response.body.data.order.items[0];
      expect(orderItem.pricePerUnit).toBe(10000);
    });

    it('should stack fixed + tiered discounts', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 20000, stock: 100 });

      // Fixed: 10% off → 18000
      variant.fixedDiscount = {
        type: 'percentage',
        value: 10,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        enabled: true,
      };
      // Tiered: 5+ gets additional 10% off (of 18000) → 16200
      variant.tieredDiscount = {
        active: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        tiers: [
          { minQuantity: 5, maxQuantity: null, type: 'percentage', value: 10 },
        ],
      };
      await variant.save();

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 5 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      const orderItem = response.body.data.order.items[0];
      // Fixed: 20000 * 0.9 = 18000, Tiered: 18000 * 0.9 = 16200
      expect(orderItem.pricePerUnit).toBe(16200);
      expect(orderItem.subtotal).toBe(81000);
    });

    it('should apply the highest qualifying tier', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 100 });

      variant.tieredDiscount = {
        active: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        tiers: [
          { minQuantity: 3, maxQuantity: null, type: 'percentage', value: 5 },
          { minQuantity: 6, maxQuantity: null, type: 'percentage', value: 10 },
          { minQuantity: 12, maxQuantity: null, type: 'percentage', value: 20 },
        ],
      };
      await variant.save();

      // Buy 8 → should get the 6+ tier (10%)
      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 8 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      const orderItem = response.body.data.order.items[0];
      expect(orderItem.pricePerUnit).toBe(9000); // 10% off
    });

    it('should not apply expired tiered discount', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 100 });

      variant.tieredDiscount = {
        active: true,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'), // Expired
        tiers: [
          { minQuantity: 1, maxQuantity: null, type: 'percentage', value: 50 },
        ],
      };
      await variant.save();

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 5 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      const orderItem = response.body.data.order.items[0];
      expect(orderItem.pricePerUnit).toBe(10000); // No discount
    });

    it('should apply amount-based tiered discount', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 100 });

      variant.tieredDiscount = {
        active: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        tiers: [
          { minQuantity: 3, maxQuantity: null, type: 'amount', value: 2000 },
        ],
      };
      await variant.save();

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 4 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      const orderItem = response.body.data.order.items[0];
      expect(orderItem.pricePerUnit).toBe(8000); // 10000 - 2000
    });
  });

  // ─── Order Status Flow ───────────────────────────────────────────────
  describe('Order status flow', () => {
    it('should follow full happy path: pending → confirmed → preparing → shipped → completed', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const variant = await createTestProductVariant({ price: 10000, stock: 100 });

      // 1. Create order via API
      const user = await createTestUser();
      const userToken = generateAuthToken(user);
      const createRes = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${userToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });
      expect(createRes.status).toBe(201);
      const orderId = createRes.body.data.order._id;

      // 2. Confirm
      const confirmRes = await request(app)
        .put(`/api/orders/${orderId}/confirm`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 5000 });
      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.order.status).toBe('confirmed');

      // 3. Preparing
      const prepRes = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Cookie', `token=${token}`)
        .send({ status: 'preparing' });
      expect(prepRes.status).toBe(200);
      expect(prepRes.body.data.order.status).toBe('preparing');

      // 4. Shipped
      const shipRes = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Cookie', `token=${token}`)
        .send({ status: 'shipped' });
      expect(shipRes.status).toBe(200);
      expect(shipRes.body.data.order.status).toBe('shipped');

      // 5. Completed
      const completeRes = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Cookie', `token=${token}`)
        .send({ status: 'completed' });
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.order.status).toBe('completed');

      // Verify timestamps were set
      const finalOrder = await Order.findById(orderId);
      expect(finalOrder?.confirmedAt).toBeDefined();
      expect(finalOrder?.completedAt).toBeDefined();
    });

    it('should allow status change from completed (e.g. back to preparing)', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'completed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Cookie', `token=${token}`)
        .send({ status: 'preparing' });

      // The system allows reverting completed orders (only cancelled is locked)
      expect(response.status).toBe(200);
      expect(response.body.data.order.status).toBe('preparing');
    });

    it('should set confirmedAt timestamp when confirming', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'pending_whatsapp' });

      await request(app)
        .put(`/api/orders/${order._id}/confirm`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 0 });

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.confirmedAt).toBeDefined();
    });

    it('should set cancelledAt timestamp when cancelling', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const order = await createTestOrder({ user, status: 'confirmed' });

      await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ cancellationReason: 'Changed my mind about this order' });

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.cancelledAt).toBeDefined();
      expect(updatedOrder?.cancellationReason).toBe('Changed my mind about this order');
    });
  });

  // ─── Order Creation Edge Cases ───────────────────────────────────────
  describe('Order creation edge cases', () => {
    it('should create order with multiple items and deduct stock for each', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const v1 = await createTestProductVariant({ price: 5000, stock: 20 });
      const v2 = await createTestProductVariant({ price: 15000, stock: 30 });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [
            { variantId: v1._id, quantity: 3 },
            { variantId: v2._id, quantity: 2 },
          ],
          deliveryMethod: 'pickup',
          paymentMethod: 'transfer',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.order.items).toHaveLength(2);
      expect(response.body.data.order.subtotal).toBe(45000); // 3*5000 + 2*15000

      const updatedV1 = await ProductVariant.findById(v1._id);
      const updatedV2 = await ProductVariant.findById(v2._id);
      expect(updatedV1?.stock).toBe(17);
      expect(updatedV2?.stock).toBe(28);
    });

    it('should generate unique sequential order numbers on same day', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ stock: 100 });

      const res1 = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      const res2 = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      const num1 = res1.body.data.order.orderNumber;
      const num2 = res2.body.data.order.orderNumber;
      expect(num1).not.toBe(num2);
      // Same prefix (same date), different sequence
      expect(num1.substring(0, 12)).toBe(num2.substring(0, 12));
    });

    it('should store variant snapshot for price history', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 15000, stock: 50 });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      const snapshot = response.body.data.order.items[0].variantSnapshot;
      expect(snapshot).toBeDefined();
      expect(snapshot.price).toBe(15000);
      expect(snapshot.name).toBeDefined();
      expect(snapshot.sku).toBeDefined();
    });

    it('should create guest order with delivery address', async () => {
      const variant = await createTestProductVariant({ price: 5000, stock: 100 });

      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
          customer: {
            name: 'Guest Buyer',
            email: 'guest@buyer.com',
            phone: '595981999888',
            address: {
              street: 'Av. Principal',
              number: '456',
              city: 'San Lorenzo',
              neighborhood: 'Centro',
              reference: 'Frente al parque',
            },
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.order.customer.address.street).toBe('Av. Principal');
      expect(response.body.data.order.customer.address.reference).toBe('Frente al parque');
    });

    it('should reject order with empty items array', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);
    });

    it('should reject order with invalid delivery method', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant();

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'drone',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);
    });

    it('should reject order with invalid payment method', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant();

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'crypto',
        });

      expect(response.status).toBe(400);
    });
  });

  // ─── Cancel edge cases ───────────────────────────────────────────────
  describe('Cancel order edge cases', () => {
    it('should reject cancelling already cancelled order', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const order = await createTestOrder({ user, status: 'cancelled' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ cancellationReason: 'Trying to cancel again' });

      expect(response.status).toBe(400);
    });

    it('should reject cancel with too short reason', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const order = await createTestOrder({ user, status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ cancellationReason: 'short' });

      expect(response.status).toBe(400);
    });

    it('should reject cancel without reason', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const order = await createTestOrder({ user, status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should allow funcionario to cancel any order', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ cancellationReason: 'Funcionario cancellation for valid reason' });

      expect(response.status).toBe(200);
      expect(response.body.data.order.status).toBe('cancelled');
    });

    it('should restore stock for all items when cancelling multi-item order', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const v1 = await createTestProductVariant({ price: 5000, stock: 20 });
      const v2 = await createTestProductVariant({ price: 8000, stock: 30 });

      const order = await createTestOrder({
        user,
        items: [
          { variantId: v1._id, quantity: 3 },
          { variantId: v2._id, quantity: 5 },
        ],
        status: 'confirmed',
      });

      // v1: 17, v2: 25
      await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ cancellationReason: 'Cancelling multi-item order for testing' });

      const updV1 = await ProductVariant.findById(v1._id);
      const updV2 = await ProductVariant.findById(v2._id);
      expect(updV1?.stock).toBe(20);
      expect(updV2?.stock).toBe(30);
    });

    it('should return whatsapp cancellation message', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const order = await createTestOrder({ user, status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ cancellationReason: 'Customer changed their mind completely' });

      expect(response.status).toBe(200);
      expect(response.body.data.whatsappMessage).toBeDefined();
      expect(response.body.data.whatsappURL).toBeDefined();
    });
  });

  // ─── Order Listing & Filtering ───────────────────────────────────────
  describe('Order listing and filtering', () => {
    it('should paginate orders', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      // Create 5 orders
      for (let i = 0; i < 5; i++) {
        await createTestOrder();
      }

      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token=${token}`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should filter by email', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const user = await createTestUser({ email: 'specific-filter@test.com' });
      await createTestOrder({ user });
      await createTestOrder(); // Different user

      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token=${token}`)
        .query({ email: 'specific-filter@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.data.forEach((o: any) => {
        expect(o.customer.email).toBe('specific-filter@test.com');
      });
    });

    it('should get my-orders only for authenticated user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestOrder({ user: user1 });
      await createTestOrder({ user: user1 });
      await createTestOrder({ user: user2 });

      const token1 = generateAuthToken(user1);
      const response = await request(app)
        .get('/api/orders/my-orders')
        .set('Cookie', `token=${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBe(2);
    });

    it('should get stats as funcionario', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      await createTestOrder({ status: 'completed' });
      await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .get('/api/orders/stats')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats).toBeDefined();
    });
  });

  // ─── WhatsApp marking ────────────────────────────────────────────────
  describe('WhatsApp sent marking', () => {
    it('should mark whatsapp sent without messageId', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder();

      const response = await request(app)
        .put(`/api/orders/${order._id}/whatsapp-sent`)
        .set('Cookie', `token=${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.order.whatsappSent).toBe(true);
      expect(response.body.data.order.whatsappSentAt).toBeDefined();
    });

    it('should mark whatsapp with messageId', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder();

      const response = await request(app)
        .put(`/api/orders/${order._id}/whatsapp-sent`)
        .set('Cookie', `token=${token}`)
        .send({ messageId: 'wamid.HBgLNTk' });

      expect(response.status).toBe(200);
      expect(response.body.data.order.whatsappMessageId).toBe('wamid.HBgLNTk');
    });
  });

  // ─── Non-existent / invalid IDs ──────────────────────────────────────
  describe('Invalid order IDs', () => {
    it('should return 404 for non-existent order ID', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .get('/api/orders/507f1f77bcf86cd799439011')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for malformed order ID', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .get('/api/orders/invalid-id')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CHECK-PHONE ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

describe('Auth API — Check Phone', () => {
  describe('POST /api/auth/check-phone', () => {
    it('should return exists=true for registered phone', async () => {
      await createTestUser({ phone: '+56912345678' });

      const response = await request(app)
        .post('/api/auth/check-phone')
        .send({ phone: '+56912345678' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(true);
    });

    it('should return exists=false for unregistered phone', async () => {
      const response = await request(app)
        .post('/api/auth/check-phone')
        .send({ phone: '+56999888777' });

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(false);
    });

    it('should normalize phone without +56 prefix', async () => {
      await createTestUser({ phone: '+56911112222' });

      const response = await request(app)
        .post('/api/auth/check-phone')
        .send({ phone: '911112222' });

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(true);
    });

    it('should reject missing phone field', async () => {
      const response = await request(app)
        .post('/api/auth/check-phone')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should reject empty phone string', async () => {
      const response = await request(app)
        .post('/api/auth/check-phone')
        .send({ phone: '' });

      expect(response.status).toBe(400);
    });

    it('should not leak user data — only returns exists boolean', async () => {
      await createTestUser({ phone: '+56912345000', name: 'Secret Name' });

      const response = await request(app)
        .post('/api/auth/check-phone')
        .send({ phone: '+56912345000' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ exists: true });
      expect(response.body.data.name).toBeUndefined();
      expect(response.body.data.email).toBeUndefined();
    });

    it('should not find inactive user phone', async () => {
      await createTestUser({ phone: '+56955556666', active: false });

      const response = await request(app)
        .post('/api/auth/check-phone')
        .send({ phone: '+56955556666' });

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(false);
    });
  });
});
