import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, createTestProductVariant, createTestOrder } from '../setup/testUtils';
import StockMovementModel, { IStockMovement } from '../../models/StockMovement';
import ProductVariant from '../../models/ProductVariant';

const StockMovement = StockMovementModel;

describe('Stock Movements API', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeEach(async () => {
    const admin = await createTestUser({ role: 'admin' });
    const funcionario = await createTestUser({ role: 'funcionario' });
    const cliente = await createTestUser({ role: 'cliente' });

    adminToken = generateAuthToken(admin);
    funcionarioToken = generateAuthToken(funcionario);
    clienteToken = generateAuthToken(cliente);
  });

  describe('GET /api/stock-movements', () => {
    it('should list all stock movements as admin', async () => {
      const variant = await createTestProductVariant({ stock: 100 });
      await StockMovement.create({
        variant: variant._id,
        type: 'adjustment',
        quantity: 10,
        previousStock: 100,
        newStock: 110,
        reason: 'Inventory count adjustment',
      });

      const response = await request(app)
        .get('/api/stock-movements')
        .set('Cookie', `token=${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by movement type', async () => {
      const variant = await createTestProductVariant({ stock: 100 });
      await StockMovement.create({
        variant: variant._id,
        type: 'restock',
        quantity: 50,
        previousStock: 100,
        newStock: 150,
      });
      await StockMovement.create({
        variant: variant._id,
        type: 'adjustment',
        quantity: -10,
        previousStock: 150,
        newStock: 140,
      });

      const response = await request(app)
        .get('/api/stock-movements')
        .set('Cookie', `token=${adminToken}`)
        .query({ type: 'restock' });

      expect(response.status).toBe(200);
      expect(response.body.data.data.every((m: any) => m.type === 'restock')).toBe(true);
    });

    it('should filter by date range', async () => {
      const variant = await createTestProductVariant();
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await StockMovement.create({
        variant: variant._id,
        type: 'adjustment',
        quantity: 10,
        previousStock: 100,
        newStock: 110,
        createdAt: new Date('2025-01-15'),
      });

      const response = await request(app)
        .get('/api/stock-movements')
        .set('Cookie', `token=${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

      expect(response.status).toBe(200);
    });

    it('should allow funcionario access', async () => {
      const response = await request(app)
        .get('/api/stock-movements')
        .set('Cookie', `token=${funcionarioToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject cliente access', async () => {
      const response = await request(app)
        .get('/api/stock-movements')
        .set('Cookie', `token=${clienteToken}`);

      expect(response.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/stock-movements');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/stock-movements/variant/:variantId', () => {
    it('should get stock history for specific variant', async () => {
      const variant = await createTestProductVariant({ stock: 100 });

      // Create multiple movements
      await StockMovement.create({
        variant: variant._id,
        type: 'restock',
        quantity: 50,
        previousStock: 100,
        newStock: 150,
      });
      await StockMovement.create({
        variant: variant._id,
        type: 'sale',
        quantity: -10,
        previousStock: 150,
        newStock: 140,
      });

      const response = await request(app)
        .get(`/api/stock-movements/variant/${variant._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.movements).toBeInstanceOf(Array);
      expect(response.body.data.movements.length).toBe(2);
    });

    it('should return empty array for variant with no movements', async () => {
      const variant = await createTestProductVariant();

      // Clear any auto-created movements
      await StockMovement.deleteMany({ variant: variant._id });

      const response = await request(app)
        .get(`/api/stock-movements/variant/${variant._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.movements).toEqual([]);
    });

    it('should return 404 for non-existent variant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/stock-movements/variant/${fakeId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject cliente access', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .get(`/api/stock-movements/variant/${variant._id}`)
        .set('Cookie', `token=${clienteToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/stock-movements/order/:orderId', () => {
    it('should get stock movements for specific order', async () => {
      const user = await createTestUser();
      const variant = await createTestProductVariant({ stock: 100 });
      const order = await createTestOrder({
        user,
        items: [{ variantId: variant._id, quantity: 5 }],
        status: 'confirmed',
      });

      const response = await request(app)
        .get(`/api/stock-movements/order/${order._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.movements).toBeInstanceOf(Array);
      expect(response.body.data.movements.some((m: any) => m.type === 'sale')).toBe(true);
    });

    it('should show cancellation movements', async () => {
      const user = await createTestUser();
      const variant = await createTestProductVariant({ stock: 100 });
      const order = await createTestOrder({
        user,
        items: [{ variantId: variant._id, quantity: 5 }],
        status: 'confirmed',
      });

      // Cancel the order
      await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${adminToken}`)
        .send({ reason: 'Test cancellation' });

      const response = await request(app)
        .get(`/api/stock-movements/order/${order._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.movements.some((m: any) => m.type === 'cancellation')).toBe(true);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/stock-movements/order/${fakeId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/stock-movements', () => {
    it('should create manual stock adjustment as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ stock: 100 });

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${token}`)
        .send({
          variantId: variant._id,
          type: 'adjustment',
          quantity: 20,
          reason: 'Manual inventory correction',
          notes: 'Found extra stock in warehouse',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.movement.type).toBe('adjustment');
      expect(response.body.data.movement.quantity).toBe(20);
      expect(response.body.data.movement.previousStock).toBe(100);
      expect(response.body.data.movement.newStock).toBe(120);

      // Verify stock was updated
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(120);
    });

    it('should create restock movement', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ stock: 50 });

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${token}`)
        .send({
          variantId: variant._id,
          type: 'restock',
          quantity: 100,
          reason: 'New supplier delivery',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.movement.newStock).toBe(150);
    });

    it('should create negative adjustment (stock reduction)', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ stock: 100 });

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${token}`)
        .send({
          variantId: variant._id,
          type: 'adjustment',
          quantity: -10,
          reason: 'Damaged goods',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.movement.newStock).toBe(90);
    });

    it('should reject reducing stock below zero', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ stock: 10 });

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${token}`)
        .send({
          variantId: variant._id,
          type: 'adjustment',
          quantity: -20,
          reason: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('stock');
    });

    it('should allow funcionario to create movements', async () => {
      const variant = await createTestProductVariant({ stock: 100 });

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${funcionarioToken}`)
        .send({
          variantId: variant._id,
          type: 'adjustment',
          quantity: 5,
          reason: 'Inventory check',
        });

      expect(response.status).toBe(201);
    });

    it('should reject cliente creating movements', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          variantId: variant._id,
          type: 'adjustment',
          quantity: 10,
          reason: 'Unauthorized',
        });

      expect(response.status).toBe(403);
    });

    it('should reject invalid movement type', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant();

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${token}`)
        .send({
          variantId: variant._id,
          type: 'invalid_type',
          quantity: 10,
          reason: 'Test',
        });

      expect(response.status).toBe(400);
    });

    it('should require reason for manual movements', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant();

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${token}`)
        .send({
          variantId: variant._id,
          type: 'adjustment',
          quantity: 10,
          // Missing reason
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent variant', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${token}`)
        .send({
          variantId: fakeId,
          type: 'adjustment',
          quantity: 10,
          reason: 'Test',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Stock Movement Types', () => {
    it('should handle "sale" type (from orders)', async () => {
      const user = await createTestUser();
      const variant = await createTestProductVariant({ stock: 100 });

      await createTestOrder({
        user,
        items: [{ variantId: variant._id, quantity: 5 }],
      });

      const movements = await StockMovement.find({
        variant: variant._id,
        type: 'sale',
      });

      expect(movements.length).toBeGreaterThan(0);
      expect(movements[0].quantity).toBe(-5);
    });

    it('should handle "cancellation" type (stock restoration)', async () => {
      const user = await createTestUser();
      const variant = await createTestProductVariant({ stock: 100 });
      const order = await createTestOrder({
        user,
        items: [{ variantId: variant._id, quantity: 5 }],
        status: 'confirmed',
      });

      await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${adminToken}`)
        .send({ reason: 'Test' });

      const movements = await StockMovement.find({
        variant: variant._id,
        type: 'cancellation',
      });

      expect(movements.length).toBeGreaterThan(0);
      expect(movements[0].quantity).toBe(5); // Positive (restored)
    });

    it('should handle "return" type', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const variant = await createTestProductVariant({ stock: 100 });

      const response = await request(app)
        .post('/api/stock-movements')
        .set('Cookie', `token=${token}`)
        .send({
          variantId: variant._id,
          type: 'return',
          quantity: 3,
          reason: 'Customer return',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.movement.type).toBe('return');
    });
  });
});
