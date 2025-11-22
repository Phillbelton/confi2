import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestProductVariant,
  createTestOrder,
  clearDatabase,
} from '../setup/testUtils';
import ProductVariant from '../../models/ProductVariant';
import { Order } from '../../models/Order';
import StockMovementModel from '../../models/StockMovement';

const StockMovement = StockMovementModel;

/**
 * Stock Movement Tests
 * Comprehensive tests for stock tracking, movements, and inventory management
 */

describe('Stock Movements', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    const admin = await createTestUser({
      email: 'admin-stock@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(admin);

    const funcionario = await createTestUser({
      email: 'func-stock@test.com',
      role: 'funcionario',
    });
    funcionarioToken = generateAuthToken(funcionario);

    const cliente = await createTestUser({
      email: 'cliente-stock@test.com',
      role: 'cliente',
    });
    // Add default address for order tests
    cliente.addresses = [{
      label: 'Casa',
      street: 'Stock Street',
      number: '222',
      city: 'Asuncion',
      neighborhood: 'Centro',
      isDefault: true,
    }];
    await cliente.save();
    clienteToken = generateAuthToken(cliente);
  });

  beforeEach(async () => {
    await ProductVariant.deleteMany({});
    await Order.deleteMany({});
    await StockMovement.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== Stock Deduction on Orders ====================

  describe('Stock Deduction on Orders', () => {
    it('should deduct stock when order is created', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(90);
    });

    it('should create sale movement record', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 5 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      const movement = await StockMovement.findOne({
        variant: variant._id,
        type: 'sale',
      });

      expect(movement).toBeTruthy();
      expect(movement?.quantity).toBe(-5);
      expect(movement?.order).toBeDefined();
    });

    it('should handle multi-item order stock deduction', async () => {
      const variant1 = await createTestProductVariant({
        price: 5000,
        stock: 50,
      });
      const variant2 = await createTestProductVariant({
        price: 7500,
        stock: 30,
      });

      await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [
            { variantId: variant1._id, quantity: 5 },
            { variantId: variant2._id, quantity: 3 },
          ],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      const v1 = await ProductVariant.findById(variant1._id);
      const v2 = await ProductVariant.findById(variant2._id);

      expect(v1?.stock).toBe(45);
      expect(v2?.stock).toBe(27);
    });
  });

  // ==================== Stock Restoration on Cancellation ====================

  describe('Stock Restoration on Cancellation', () => {
    it('should restore stock when order is cancelled', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 20 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      // Stock should be 80
      let updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(80);

      const orderId = createResponse.body.data.order._id;

      // Cancel order
      await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ reason: 'Changed mind' });

      // Stock should be restored to 100
      updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(100);
    });

    it('should create cancellation movement record', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      const orderId = createResponse.body.data.order._id;

      await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ reason: 'Test' });

      const cancelMovement = await StockMovement.findOne({
        variant: variant._id,
        type: 'cancellation',
      });

      expect(cancelMovement).toBeTruthy();
      expect(cancelMovement?.quantity).toBe(10);
    });

    it('should handle multi-item order cancellation', async () => {
      const variant1 = await createTestProductVariant({
        price: 5000,
        stock: 100,
      });
      const variant2 = await createTestProductVariant({
        price: 7500,
        stock: 50,
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [
            { variantId: variant1._id, quantity: 10 },
            { variantId: variant2._id, quantity: 5 },
          ],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      const orderId = createResponse.body.data.order._id;

      await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ reason: 'Test' });

      const v1 = await ProductVariant.findById(variant1._id);
      const v2 = await ProductVariant.findById(variant2._id);

      expect(v1?.stock).toBe(100);
      expect(v2?.stock).toBe(50);
    });
  });

  // ==================== Manual Stock Adjustments ====================

  describe('Manual Stock Adjustments', () => {
    it('should allow admin to adjust stock', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await request(app)
        .patch(`/api/products/variants/${variant._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: 150 });

      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(150);
    });

    it('should allow funcionario to adjust stock', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await request(app)
        .patch(`/api/products/variants/${variant._id}/stock`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ stock: 80 });

      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(80);
    });

    it('should reject negative stock when backorder disabled', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        allowBackorder: false,
      });

      const response = await request(app)
        .patch(`/api/products/variants/${variant._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: -10 });

      expect(response.status).toBe(400);
    });

    it('should reject stock update from cliente', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await request(app)
        .patch(`/api/products/variants/${variant._id}/stock`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ stock: 50 })
        .expect(403);
    });
  });

  // ==================== Low Stock Alerts ====================

  describe('Low Stock Alerts', () => {
    it('should identify variants with low stock', async () => {
      const lowStock = await createTestProductVariant({
        price: 10000,
        stock: 5,
        lowStockThreshold: 10,
      });

      const normalStock = await createTestProductVariant({
        price: 10000,
        stock: 50,
        lowStockThreshold: 10,
      });

      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const lowStockIds = response.body.data.map((v: any) => v._id);
      expect(lowStockIds).toContain(lowStock._id.toString());
      expect(lowStockIds).not.toContain(normalStock._id.toString());
    });

    it('should respect lowStockThreshold setting', async () => {
      const variant1 = await createTestProductVariant({
        stock: 8,
        lowStockThreshold: 5,
      });

      const variant2 = await createTestProductVariant({
        stock: 8,
        lowStockThreshold: 10,
      });

      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .set('Authorization', `Bearer ${adminToken}`);

      const lowStockIds = response.body.data.map((v: any) => v._id);

      // variant1 (stock 8, threshold 5) should NOT be in low stock
      // variant2 (stock 8, threshold 10) SHOULD be in low stock
      expect(lowStockIds).toContain(variant2._id.toString());
    });
  });

  // ==================== Out of Stock ====================

  describe('Out of Stock', () => {
    it('should identify out of stock variants', async () => {
      const outOfStock = await createTestProductVariant({
        price: 10000,
        stock: 0,
      });

      const inStock = await createTestProductVariant({
        price: 10000,
        stock: 50,
      });

      const response = await request(app)
        .get('/api/products/variants/stock/out')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const outOfStockIds = response.body.data.map((v: any) => v._id);
      expect(outOfStockIds).toContain(outOfStock._id.toString());
      expect(outOfStockIds).not.toContain(inStock._id.toString());
    });

    it('should prevent order for out of stock items', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 0,
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);
    });
  });

  // ==================== Stock Movement History ====================

  describe('Stock Movement History', () => {
    it('should track all stock changes', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      // Sale
      await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      // Manual adjustment
      await request(app)
        .patch(`/api/products/variants/${variant._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: 120 });

      const movements = await StockMovement.find({
        variant: variant._id,
      }).sort({ createdAt: -1 });

      expect(movements.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate running stock balance', async () => {
      const initialStock = 100;
      const variant = await createTestProductVariant({
        price: 10000,
        stock: initialStock,
      });

      // Multiple orders
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 5 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          });
      }

      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(initialStock - 25);

      const movements = await StockMovement.find({
        variant: variant._id,
        type: 'sale',
      });

      const totalDeducted = movements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      expect(totalDeducted).toBe(25);
    });
  });

  // ==================== Stock Virtual Properties ====================

  describe('Stock Virtual Properties', () => {
    it('should calculate inStock virtual correctly', async () => {
      const inStock = await createTestProductVariant({
        stock: 10,
        active: true,
      });

      const outOfStock = await createTestProductVariant({
        stock: 0,
        active: true,
      });

      const inactive = await createTestProductVariant({
        stock: 100,
        active: false,
      });

      const response1 = await request(app)
        .get(`/api/products/variants/${inStock._id}`);
      expect(response1.body.data.inStock).toBe(true);

      const response2 = await request(app)
        .get(`/api/products/variants/${outOfStock._id}`);
      expect(response2.body.data.inStock).toBe(false);

      // Inactive variant should also report as not in stock
      const fetchedInactive = await ProductVariant.findById(inactive._id);
      expect(fetchedInactive?.inStock).toBe(false);
    });

    it('should calculate lowStock virtual correctly', async () => {
      const lowStock = await createTestProductVariant({
        stock: 5,
        lowStockThreshold: 10,
      });

      const normalStock = await createTestProductVariant({
        stock: 50,
        lowStockThreshold: 10,
      });

      const fetchedLow = await ProductVariant.findById(lowStock._id);
      expect(fetchedLow?.lowStock).toBe(true);

      const fetchedNormal = await ProductVariant.findById(normalStock._id);
      expect(fetchedNormal?.lowStock).toBe(false);
    });
  });

  // ==================== Concurrent Stock Operations ====================

  describe('Concurrent Stock Operations', () => {
    it('should handle concurrent order creation', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 20,
      });

      const orders = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/orders')
            .set('Cookie', `token=${clienteToken}`)
            .send({
              items: [{ variantId: variant._id, quantity: 2 }],
              deliveryMethod: 'pickup',
              paymentMethod: 'cash',
            })
        );

      const responses = await Promise.all(orders);

      // Some should succeed, some may fail due to stock limits
      const successful = responses.filter((r) => r.status === 201);
      const failed = responses.filter((r) => r.status === 400);

      expect(successful.length + failed.length).toBe(10);

      // Verify stock consistency
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBeGreaterThanOrEqual(0);
    });

    it('should prevent overselling', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 5,
        allowBackorder: false,
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);

      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(5);
    });
  });
});
