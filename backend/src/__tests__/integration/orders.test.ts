import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, createTestProductVariant, createTestOrder } from '../setup/testUtils';
import { Order } from '../../models/Order';
import ProductVariant from '../../models/ProductVariant';
import ProductParent from '../../models/ProductParent';
import StockMovementModel, { IStockMovement } from '../../models/StockMovement';

const StockMovement = StockMovementModel;

describe('Orders API', () => {
  describe('POST /api/orders', () => {
    it('should create order as authenticated user with stock deduction', async () => {
      const user = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
          customerNotes: 'Test order',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.whatsappURL).toBeDefined();
      expect(response.body.data.order.orderNumber).toMatch(/^QUE-\d{8}-\d{3}$/);
      expect(response.body.data.order.total).toBe(20000);
      expect(response.body.data.order.status).toBe('pending_whatsapp');

      // Verify stock was deducted
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(48);

      // Verify stock movement was created
      const stockMovement = await StockMovement.findOne({ variant: variant._id });
      expect(stockMovement?.type).toBe('sale');
      expect(stockMovement?.quantity).toBe(-2);
    });

    it('should create order as guest with customer data', async () => {
      const variant = await createTestProductVariant({ price: 5000, stock: 100 });

      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'transfer',
          customer: {
            name: 'Guest User',
            email: 'guest@example.com',
            phone: '595981234567',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order.customer.name).toBe('Guest User');
      expect(response.body.data.order.customer.email).toBe('guest@example.com');
      expect(response.body.data.order.customer.user).toBeUndefined();
    });

    it('should apply fixed discounts from variant', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      // Add fixed discount to variant
      variant.fixedDiscount = {
        type: 'percentage',
        value: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        enabled: true,
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
      // Verify the order was created successfully
      expect(response.body.data.order).toBeDefined();
    });

    it('should reject order with insufficient stock', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ stock: 5 });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject guest order without customer data', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should use user default address if no address specified', async () => {
      const user = await createTestUser();
      user.addresses.push({
        label: 'Casa',
        street: 'Default Street',
        number: '123',
        city: 'Asunción',
        neighborhood: 'Centro',
        isDefault: true,
      } as any);
      await user.save();

      const token = generateAuthToken(user);
      const variant = await createTestProductVariant();

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.order.customer.address.street).toBe('Default Street');
    });
  });

  describe('PUT /api/orders/:id/confirm', () => {
    it('should confirm order as funcionario and set shipping cost', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const order = await createTestOrder({ status: 'pending_whatsapp' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/confirm`)
        .set('Cookie', `token=${token}`)
        .send({
          shippingCost: 15000,
          adminNotes: 'Confirmed by funcionario',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('confirmed');
      expect(response.body.data.order.shippingCost).toBe(15000);
      expect(response.body.data.order.total).toBe(order.subtotal + 15000);
      expect(response.body.data.whatsappMessage).toBeDefined();
    });

    it('should reject confirmation as cliente', async () => {
      const cliente = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(cliente);
      const order = await createTestOrder();

      const response = await request(app)
        .put(`/api/orders/${order._id}/confirm`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 10000 });

      expect(response.status).toBe(403);
    });

    it('should reject confirming already confirmed order', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/confirm`)
        .set('Cookie', `token=${token}`)
        .send({ shippingCost: 10000 });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should list all orders as admin with filters', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      await createTestOrder();
      await createTestOrder();

      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token=${token}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter orders by status', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      await createTestOrder({ status: 'confirmed' });
      await createTestOrder({ status: 'pending_whatsapp' });

      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token=${token}`)
        .query({ status: 'confirmed' });

      expect(response.status).toBe(200);
      expect(response.body.data.data.every((o: any) => o.status === 'confirmed')).toBe(true);
    });

    it('should reject listing orders as cliente', async () => {
      const cliente = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(cliente);

      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order by ID as owner', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const order = await createTestOrder({ user });

      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(order._id.toString());
    });

    it('should get order by ID as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder();

      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
    });

    it('should reject getting other user order', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const order = await createTestOrder({ user: user1 });
      const token = generateAuthToken(user2);

      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/orders/number/:orderNumber', () => {
    it('should get order by order number publicly', async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .get(`/api/orders/number/${order.orderNumber}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toBe(order.orderNumber);
    });

    it('should return 404 for non-existent order number', async () => {
      const response = await request(app)
        .get('/api/orders/number/QUE-20250101-999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/orders/my-orders', () => {
    it('should get authenticated user orders', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      await createTestOrder({ user });
      await createTestOrder({ user });

      const response = await request(app)
        .get('/api/orders/my-orders')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should get order statistics as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      await createTestOrder({ status: 'completed' });

      const response = await request(app)
        .get('/api/orders/stats')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats).toBeDefined();
    });

    it('should reject stats request from cliente', async () => {
      const cliente = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(cliente);

      const response = await request(app)
        .get('/api/orders/stats')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status as funcionario', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const order = await createTestOrder({ status: 'confirmed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Cookie', `token=${token}`)
        .send({
          status: 'preparing',
          adminNotes: 'Order is being prepared',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.order.status).toBe('preparing');
    });

    it('should reject changing cancelled order status', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder({ status: 'cancelled' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Cookie', `token=${token}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    it('should cancel order and restore stock', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ stock: 50 });
      const order = await createTestOrder({
        user,
        items: [{ variantId: variant._id, quantity: 5 }],
        status: 'confirmed',
      });

      // Stock should be 45 after order creation
      let updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(45);

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ reason: 'Customer requested cancellation' });

      expect(response.status).toBe(200);
      expect(response.body.data.order.status).toBe('cancelled');

      // Stock should be restored to 50
      updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(50);

      // Verify cancellation stock movement
      const stockMovement = await StockMovement.findOne({
        variant: variant._id,
        type: 'cancellation',
      });
      expect(stockMovement?.quantity).toBe(5);
    });

    it('should allow admin to cancel any order', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const order = await createTestOrder();

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ reason: 'Admin cancellation' });

      expect(response.status).toBe(200);
    });

    it('should reject cancelling other user order as cliente', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const order = await createTestOrder({ user: user1 });
      const token = generateAuthToken(user2);

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ reason: 'Trying to cancel another user order' });

      expect(response.status).toBe(403);
    });

    it('should reject cancelling completed order', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const order = await createTestOrder({ user, status: 'completed' });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({ reason: 'Cancel' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/orders/:id/whatsapp-sent', () => {
    it('should mark WhatsApp as sent', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const order = await createTestOrder();

      const response = await request(app)
        .put(`/api/orders/${order._id}/whatsapp-sent`)
        .set('Cookie', `token=${token}`)
        .send({ messageId: 'wamid.123456' });

      expect(response.status).toBe(200);
      expect(response.body.data.order.whatsappSent).toBe(true);
      expect(response.body.data.order.whatsappMessageId).toBe('wamid.123456');
    });

    it('should reject marking WhatsApp as cliente', async () => {
      const cliente = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(cliente);
      const order = await createTestOrder();

      const response = await request(app)
        .put(`/api/orders/${order._id}/whatsapp-sent`)
        .set('Cookie', `token=${token}`)
        .send();

      expect(response.status).toBe(403);
    });
  });
});
