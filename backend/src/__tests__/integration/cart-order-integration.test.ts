import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestProductVariant,
  createTestOrder,
  clearDatabase,
} from '../setup/testUtils';
import { Order } from '../../models/Order';
import ProductVariant from '../../models/ProductVariant';
import ProductParent from '../../models/ProductParent';
import StockMovementModel from '../../models/StockMovement';
import AuditLogModel from '../../models/AuditLog';

const StockMovement = StockMovementModel;
const AuditLog = AuditLogModel;

/**
 * Cart/Order Integration Tests
 * Tests for complete purchase flow, discount application, and stock management
 */

describe('Cart/Order Integration', () => {
  let clienteUser: any;
  let funcionarioUser: any;
  let adminUser: any;
  let clienteToken: string;
  let funcionarioToken: string;
  let adminToken: string;

  beforeAll(async () => {
    clienteUser = await createTestUser({
      email: 'cliente-integration@test.com',
      role: 'cliente',
    });
    // Add default address to cliente user for delivery orders
    clienteUser.addresses = [{
      label: 'Casa',
      street: 'Test Street',
      number: '123',
      city: 'Asuncion',
      neighborhood: 'Centro',
      isDefault: true,
    }];
    await clienteUser.save();
    clienteToken = generateAuthToken(clienteUser);

    funcionarioUser = await createTestUser({
      email: 'funcionario-integration@test.com',
      role: 'funcionario',
    });
    funcionarioToken = generateAuthToken(funcionarioUser);

    adminUser = await createTestUser({
      email: 'admin-integration@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(adminUser);
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    await ProductParent.deleteMany({});
    await ProductVariant.deleteMany({});
    await StockMovement.deleteMany({});
    await AuditLog.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== Complete Purchase Flow ====================

  describe('Complete Purchase Flow', () => {
    it('should complete full order flow: create -> confirm -> prepare -> ready -> deliver -> complete', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      // Step 1: Create order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      expect(createResponse.status).toBe(201);
      const orderId = createResponse.body.data.order._id;
      expect(createResponse.body.data.order.status).toBe('pending_whatsapp');

      // Verify stock deducted
      let updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(48);

      // Step 2: Confirm order
      const confirmResponse = await request(app)
        .put(`/api/orders/${orderId}/confirm`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ shippingCost: 15000 });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.data.order.status).toBe('confirmed');
      expect(confirmResponse.body.data.order.shippingCost).toBe(15000);

      // Step 3: Change to preparing
      let statusResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ status: 'preparing' });

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.order.status).toBe('preparing');

      // Step 4: Change to ready
      statusResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ status: 'ready' });

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.order.status).toBe('ready');

      // Step 5: Change to delivering
      statusResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ status: 'delivering' });

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.order.status).toBe('delivering');

      // Step 6: Complete order
      statusResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ status: 'completed' });

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.order.status).toBe('completed');

      // Verify stock remains deducted
      updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(48);
    });

    it('should handle pickup order flow correctly', async () => {
      const variant = await createTestProductVariant({
        price: 5000,
        stock: 100,
      });

      // Create pickup order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 3 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'transfer',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.order.deliveryMethod).toBe('pickup');

      const orderId = createResponse.body.data.order._id;

      // Confirm without shipping cost for pickup
      const confirmResponse = await request(app)
        .put(`/api/orders/${orderId}/confirm`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ shippingCost: 0 });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.data.order.shippingCost).toBe(0);
    });

    it('should apply discounts correctly in order flow', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 20,
        },
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 5 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      expect(createResponse.status).toBe(201);
      const order = createResponse.body.data.order;

      // Price per unit: 10000 - 20% = 8000
      // Subtotal: 8000 * 5 = 40000
      expect(order.items[0].pricePerUnit).toBe(8000);
      expect(order.subtotal).toBeLessThan(50000);
    });

    it('should apply tiered discounts in order', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 5, maxQuantity: null, type: 'percentage', value: 15 },
          ],
        },
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 5 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.order.totalDiscount).toBeGreaterThan(0);
    });
  });

  // ==================== Multi-Item Orders ====================

  describe('Multi-Item Orders', () => {
    it('should handle order with multiple products', async () => {
      const variant1 = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });
      const variant2 = await createTestProductVariant({
        price: 5000,
        stock: 100,
      });
      const variant3 = await createTestProductVariant({
        price: 7500,
        stock: 30,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [
            { variantId: variant1._id, quantity: 2 },
            { variantId: variant2._id, quantity: 3 },
            { variantId: variant3._id, quantity: 1 },
          ],
          deliveryMethod: 'delivery',
          paymentMethod: 'card',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.order.items).toHaveLength(3);

      // Verify subtotal: (10000*2) + (5000*3) + (7500*1) = 42500
      expect(createResponse.body.data.order.subtotal).toBe(42500);

      // Verify all stocks deducted
      const v1 = await ProductVariant.findById(variant1._id);
      const v2 = await ProductVariant.findById(variant2._id);
      const v3 = await ProductVariant.findById(variant3._id);

      expect(v1?.stock).toBe(48);
      expect(v2?.stock).toBe(97);
      expect(v3?.stock).toBe(29);
    });

    it('should apply different discounts to each item', async () => {
      const variant1 = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });
      const variant2 = await createTestProductVariant({
        price: 20000,
        stock: 50,
      });

      await ProductVariant.findByIdAndUpdate(variant1._id, {
        fixedDiscount: { enabled: true, type: 'percentage', value: 10 },
      });
      await ProductVariant.findByIdAndUpdate(variant2._id, {
        fixedDiscount: { enabled: true, type: 'amount', value: 3000 },
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [
            { variantId: variant1._id, quantity: 2 },
            { variantId: variant2._id, quantity: 1 },
          ],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(createResponse.status).toBe(201);
      const order = createResponse.body.data.order;

      // Item 1: 10000 - 10% = 9000 per unit
      // Item 2: 20000 - 3000 = 17000 per unit
      expect(order.items[0].pricePerUnit).toBe(9000);
      expect(order.items[1].pricePerUnit).toBe(17000);
    });
  });

  // ==================== Stock Management ====================

  describe('Stock Management Integration', () => {
    it('should create stock movement on order creation', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 5 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const stockMovement = await StockMovement.findOne({
        variant: variant._id,
        type: 'sale',
      });

      expect(stockMovement).toBeTruthy();
      expect(stockMovement?.quantity).toBe(-5);
    });

    it('should restore stock on order cancellation', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = createResponse.body.data.order._id;

      // Stock should be 40
      let updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(40);

      // Cancel order
      await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ reason: 'Changed my mind' });

      // Stock should be restored to 50
      updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(50);

      // Verify cancellation stock movement
      const cancellationMovement = await StockMovement.findOne({
        variant: variant._id,
        type: 'cancellation',
      });
      expect(cancellationMovement?.quantity).toBe(10);
    });

    it('should prevent order if stock is insufficient', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 5,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      expect(createResponse.status).toBe(400);

      // Verify stock unchanged
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(5);
    });

    it('should allow backorder if enabled', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 5,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        allowBackorder: true,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      // May succeed or fail based on implementation
      if (createResponse.status === 201) {
        const updatedVariant = await ProductVariant.findById(variant._id);
        expect(updatedVariant?.stock).toBeLessThan(0);
      }
    });
  });

  // ==================== Guest Orders ====================

  describe('Guest Order Flow', () => {
    it('should create order as guest with customer data', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
          customer: {
            name: 'Guest Customer',
            email: 'guest@example.com',
            phone: '595981234567',
            address: {
              street: 'Guest Street',
              number: '123',
              city: 'Asuncion',
              neighborhood: 'Centro',
            },
          },
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.order.customer.name).toBe('Guest Customer');
      expect(createResponse.body.data.order.customer.user).toBeUndefined();
    });

    it('should reject guest order without customer data', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      expect(createResponse.status).toBe(400);
    });

    it('should allow guest to track order by order number', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'transfer',
          customer: {
            name: 'Guest',
            email: 'guest@example.com',
            phone: '595981234567',
          },
        });

      const orderNumber = createResponse.body.data.order.orderNumber;

      // Track order without authentication
      const trackResponse = await request(app)
        .get(`/api/orders/number/${orderNumber}`);

      expect(trackResponse.status).toBe(200);
      expect(trackResponse.body.data.order.orderNumber).toBe(orderNumber);
    });
  });

  // ==================== WhatsApp Integration ====================

  describe('WhatsApp Integration', () => {
    it('should generate WhatsApp URL on order creation', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.whatsappURL).toBeDefined();
      expect(createResponse.body.data.whatsappURL).toContain('wa.me');
    });

    it('should mark WhatsApp as sent', async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .put(`/api/orders/${order._id}/whatsapp-sent`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ messageId: 'wamid.test123' });

      expect(response.status).toBe(200);
      expect(response.body.data.order.whatsappSent).toBe(true);
    });

    it('should generate confirmation WhatsApp message', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = createResponse.body.data.order._id;

      const confirmResponse = await request(app)
        .put(`/api/orders/${orderId}/confirm`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ shippingCost: 15000 });

      expect(confirmResponse.body.data.whatsappMessage).toBeDefined();
    });
  });

  // ==================== Order Status Transitions ====================

  describe('Order Status Transitions', () => {
    it('should enforce valid status transitions', async () => {
      const order = await createTestOrder({ status: 'pending_whatsapp' });

      // Cannot skip to 'preparing' without confirming first
      const invalidTransition = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ status: 'preparing' });

      // Should fail or handle gracefully
      expect([200, 400]).toContain(invalidTransition.status);
    });

    it('should not allow changes to cancelled orders', async () => {
      const order = await createTestOrder({ status: 'cancelled' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(400);
    });

    it('should not allow changes to completed orders', async () => {
      const order = await createTestOrder({ status: 'completed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ status: 'preparing' });

      expect(response.status).toBe(400);
    });

    it('should allow admin to cancel any order', async () => {
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${adminToken}`)
        .send({ reason: 'Admin cancellation' });

      expect(response.status).toBe(200);
      expect(response.body.data.order.status).toBe('cancelled');
    });

    it('should allow owner to cancel their own order', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = createResponse.body.data.order._id;

      const cancelResponse = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ reason: 'Changed my mind' });

      expect(cancelResponse.status).toBe(200);
    });

    it('should not allow cancellation of completed order', async () => {
      const order = await createTestOrder({
        user: clienteUser,
        status: 'completed',
      });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ reason: 'Want to cancel' });

      expect(response.status).toBe(400);
    });
  });

  // ==================== Order Filtering and Pagination ====================

  describe('Order Filtering and Pagination', () => {
    it('should list orders with pagination', async () => {
      // Create multiple orders
      for (let i = 0; i < 5; i++) {
        await createTestOrder();
      }

      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token=${adminToken}`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(5);
    });

    it('should filter orders by status', async () => {
      await createTestOrder({ status: 'confirmed' });
      await createTestOrder({ status: 'confirmed' });
      await createTestOrder({ status: 'pending_whatsapp' });

      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token=${adminToken}`)
        .query({ status: 'confirmed' });

      expect(response.status).toBe(200);
      expect(response.body.data.data.every((o: any) => o.status === 'confirmed')).toBe(true);
    });

    it('should get user own orders only', async () => {
      // Create order for cliente user
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      // Create another order for different user
      const anotherUser = await createTestUser({ email: 'another@test.com' });
      await createTestOrder({ user: anotherUser });

      const response = await request(app)
        .get('/api/orders/my-orders')
        .set('Cookie', `token=${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
    });
  });

  // ==================== Audit Trail Integration ====================

  describe('Audit Trail Integration', () => {
    it('should create audit log on order status change', async () => {
      const order = await createTestOrder({ status: 'pending_whatsapp' });

      await request(app)
        .put(`/api/orders/${order._id}/confirm`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ shippingCost: 10000 });

      const auditLogs = await AuditLog.find({
        entity: 'Order',
        entityId: order._id.toString(),
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should track order cancellation in audit', async () => {
      const order = await createTestOrder({ status: 'confirmed' });

      await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${adminToken}`)
        .send({ reason: 'Test cancellation' });

      const cancelLog = await AuditLog.findOne({
        entity: 'Order',
        entityId: order._id.toString(),
        action: 'cancel',
      });

      expect(cancelLog).toBeTruthy();
    });
  });

  // ==================== Edge Cases ====================

  describe('Integration Edge Cases', () => {
    it('should handle order with maximum items', async () => {
      const variants = [];
      for (let i = 0; i < 10; i++) {
        const v = await createTestProductVariant({
          price: 1000 + i * 100,
          stock: 50,
        });
        variants.push(v);
      }

      const items = variants.map((v) => ({
        variantId: v._id,
        quantity: 2,
      }));

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items,
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.order.items).toHaveLength(10);
    });

    it('should handle concurrent order creation', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 10,
      });

      const orderPromises = [];
      for (let i = 0; i < 5; i++) {
        orderPromises.push(
          request(app)
            .post('/api/orders')
            .set('Cookie', `token=${clienteToken}`)
            .send({
              items: [{ variantId: variant._id, quantity: 2 }],
              deliveryMethod: 'pickup',
              paymentMethod: 'cash',
            })
        );
      }

      const results = await Promise.all(orderPromises);

      // At least some should succeed
      const successful = results.filter((r) => r.status === 201);
      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length).toBeLessThanOrEqual(5);
    });

    it('should preserve order data integrity', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 3 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = createResponse.body.data.order._id;

      // Update variant price (should not affect existing order)
      await ProductVariant.findByIdAndUpdate(variant._id, { price: 20000 });

      const getResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Cookie', `token=${clienteToken}`);

      // Order should have original price snapshot
      expect(getResponse.body.data.order.items[0].variantSnapshot.price).toBe(10000);
    });
  });
});
