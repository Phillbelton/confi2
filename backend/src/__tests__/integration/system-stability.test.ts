import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestProductParent,
  createTestProductVariant,
  createTestCategory,
  createTestBrand,
  createTestOrder,
  clearDatabase,
} from '../setup/testUtils';
import ProductParent from '../../models/ProductParent';
import ProductVariant from '../../models/ProductVariant';
import { Order } from '../../models/Order';
import { Category } from '../../models/Category';
import { Brand } from '../../models/Brand';
import { User } from '../../models/User';
import AuditLogModel from '../../models/AuditLog';
import StockMovementModel from '../../models/StockMovement';

const AuditLog = AuditLogModel;
const StockMovement = StockMovementModel;

/**
 * System Stability Tests
 * Tests for system behavior under load, concurrent operations, and extended use
 */

describe('System Stability', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    const admin = await createTestUser({
      email: 'admin-stability@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(admin);

    const funcionario = await createTestUser({
      email: 'func-stability@test.com',
      role: 'funcionario',
    });
    funcionarioToken = generateAuthToken(funcionario);

    const cliente = await createTestUser({
      email: 'cliente-stability@test.com',
      role: 'cliente',
    });
    // Add default address for order tests
    cliente.addresses = [{
      label: 'Casa',
      street: 'Stability Street',
      number: '456',
      city: 'Asuncion',
      neighborhood: 'Centro',
      isDefault: true,
    }];
    await cliente.save();
    clienteToken = generateAuthToken(cliente);
  });

  beforeEach(async () => {
    await ProductParent.deleteMany({});
    await ProductVariant.deleteMany({});
    await Order.deleteMany({});
    await AuditLog.deleteMany({});
    await StockMovement.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== Concurrent Operations ====================

  describe('Concurrent Operations', () => {
    it('should handle concurrent product reads', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      for (let i = 0; i < 10; i++) {
        await createTestProductParent({
          name: `Product ${i}`,
          categories: [category._id],
          brand: brand._id,
        });
      }

      const requests = Array(20)
        .fill(null)
        .map(() => request(app).get('/api/products/parents'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(10);
      });
    });

    it('should handle concurrent product writes', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const requests = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post('/api/products/parents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: `Concurrent Product ${i}-${Date.now()}`,
              description: 'Test description',
              categories: [category._id.toString()],
              brand: brand._id.toString(),
            })
        );

      const responses = await Promise.all(requests);

      const successful = responses.filter((r) => r.status === 201);
      expect(successful.length).toBe(5);

      // Verify all products created
      const products = await ProductParent.find({});
      expect(products.length).toBe(5);
    });

    it('should handle concurrent variant stock updates', async () => {
      const variant = await createTestProductVariant({
        stock: 1000,
      });

      // 10 concurrent stock updates
      const requests = Array(10)
        .fill(null)
        .map((_, i) =>
          request(app)
            .patch(`/api/products/variants/${variant._id}/stock`)
            .set('Authorization', `Bearer ${funcionarioToken}`)
            .send({ stock: 900 + i })
        );

      const responses = await Promise.all(requests);

      const successful = responses.filter((r) => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);

      // Verify stock is valid
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBeGreaterThanOrEqual(0);
    });

    it('should handle concurrent order creation', async () => {
      const variant = await createTestProductVariant({
        stock: 100,
        price: 5000,
      });

      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/orders')
            .set('Cookie', `token=${clienteToken}`)
            .send({
              items: [{ variantId: variant._id, quantity: 5 }],
              deliveryMethod: 'pickup',
              paymentMethod: 'cash',
            })
        );

      const responses = await Promise.all(requests);

      const successful = responses.filter((r) => r.status === 201);
      // Should create some orders (limited by stock)
      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length).toBeLessThanOrEqual(10);

      // Verify stock consistency
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed concurrent operations', async () => {
      const variant = await createTestProductVariant({
        stock: 100,
        price: 10000,
      });

      const operations = [
        // Reads
        request(app).get('/api/products/parents'),
        request(app).get('/api/products/parents'),
        request(app).get(`/api/products/variants/${variant._id}`),
        // Writes
        request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 2 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          }),
        request(app)
          .patch(`/api/products/variants/${variant._id}/stock`)
          .set('Authorization', `Bearer ${funcionarioToken}`)
          .send({ stock: 95 }),
      ];

      const responses = await Promise.all(operations);

      // All operations should complete
      responses.forEach((response) => {
        expect([200, 201, 400]).toContain(response.status);
      });
    });
  });

  // ==================== Bulk Operations ====================

  describe('Bulk Operations', () => {
    it('should handle bulk product creation', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const products = [];
      for (let i = 0; i < 50; i++) {
        products.push(
          createTestProductParent({
            name: `Bulk Product ${i}`,
            categories: [category._id],
            brand: brand._id,
          })
        );
      }

      await Promise.all(products);

      const count = await ProductParent.countDocuments();
      expect(count).toBe(50);
    });

    it('should handle bulk variant creation', async () => {
      const parent = await createTestProductParent();

      const variants = [];
      for (let i = 0; i < 30; i++) {
        variants.push(
          createTestProductVariant({
            parentProduct: parent._id,
            price: 1000 + i * 100,
            stock: 50,
          })
        );
      }

      await Promise.all(variants);

      const count = await ProductVariant.countDocuments({ parentProduct: parent._id });
      expect(count).toBe(30);
    });

    it('should handle bulk order creation', async () => {
      const variant = await createTestProductVariant({
        stock: 1000,
        price: 100,
      });

      const orders = [];
      for (let i = 0; i < 20; i++) {
        orders.push(
          request(app)
            .post('/api/orders')
            .set('Cookie', `token=${clienteToken}`)
            .send({
              items: [{ variantId: variant._id, quantity: 1 }],
              deliveryMethod: 'pickup',
              paymentMethod: 'cash',
            })
        );
      }

      const responses = await Promise.all(orders);

      const successful = responses.filter((r) => r.status === 201);
      expect(successful.length).toBeGreaterThan(15);

      // Verify stock deducted correctly
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(1000 - successful.length);
    });
  });

  // ==================== Data Integrity Under Load ====================

  describe('Data Integrity Under Load', () => {
    it('should maintain order totals accuracy under concurrent updates', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 200,
      });

      const orders = [];
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 5 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          });

        if (response.status === 201) {
          orders.push(response.body.data.order);
        }
      }

      // Verify all orders have correct totals
      orders.forEach((order) => {
        expect(order.subtotal).toBe(50000); // 10000 * 5
        expect(order.total).toBe(order.subtotal + order.shippingCost);
      });
    });

    it('should maintain stock consistency across operations', async () => {
      const initialStock = 100;
      const variant = await createTestProductVariant({
        price: 5000,
        stock: initialStock,
      });

      let orderCount = 0;
      let cancelCount = 0;

      // Create orders
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 3 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          });

        if (response.status === 201) {
          orderCount++;

          // Cancel some orders
          if (i % 3 === 0) {
            const cancelResponse = await request(app)
              .put(`/api/orders/${response.body.data.order._id}/cancel`)
              .set('Cookie', `token=${clienteToken}`)
              .send({ reason: 'Test cancel' });

            if (cancelResponse.status === 200) {
              cancelCount++;
            }
          }
        }
      }

      // Verify stock
      const updatedVariant = await ProductVariant.findById(variant._id);
      const expectedStock = initialStock - (orderCount - cancelCount) * 3;
      expect(updatedVariant?.stock).toBe(expectedStock);
    });

    it('should create accurate audit trail under load', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      // Perform multiple updates
      for (let i = 0; i < 10; i++) {
        await request(app)
          .put(`/api/products/variants/${variant._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 10000 + i * 100 });
      }

      // Verify audit logs created
      const auditLogs = await AuditLog.find({
        entity: 'ProductVariant',
        entityId: variant._id.toString(),
        action: 'update',
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(10);
    });
  });

  // ==================== Memory and Resource Management ====================

  describe('Resource Management', () => {
    it('should handle large dataset queries efficiently', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      // Create many products
      const products = [];
      for (let i = 0; i < 100; i++) {
        products.push(
          createTestProductParent({
            name: `Large Dataset Product ${i}`,
            categories: [category._id],
            brand: brand._id,
          })
        );
      }
      await Promise.all(products);

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products/parents')
        .query({ limit: 100 });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle pagination efficiently', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      // Create products
      for (let i = 0; i < 50; i++) {
        await createTestProductParent({
          name: `Paginated Product ${i}`,
          categories: [category._id],
          brand: brand._id,
        });
      }

      const startTime = Date.now();

      // Fetch multiple pages
      const pages = [];
      for (let page = 0; page < 5; page++) {
        pages.push(
          request(app)
            .get('/api/products/parents')
            .query({ skip: page * 10, limit: 10 })
        );
      }

      const responses = await Promise.all(pages);
      const duration = Date.now() - startTime;

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(10);
      });

      expect(duration).toBeLessThan(3000);
    });
  });

  // ==================== Error Recovery ====================

  describe('Error Recovery', () => {
    it('should recover from partial order creation failure', async () => {
      const variant = await createTestProductVariant({
        stock: 5,
        price: 10000,
      });

      // Try to create order with more stock than available
      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);

      // Verify stock unchanged
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(5);

      // Verify no partial order created
      const orders = await Order.find({});
      expect(orders.length).toBe(0);
    });

    it('should handle invalid product ID gracefully', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      const response = await request(app)
        .get(`/api/products/parents/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed request body', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing required fields
          name: 'Incomplete',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== Session Stability ====================

  describe('Session Stability', () => {
    it('should maintain authentication across multiple requests', async () => {
      const requests = Array(20)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${adminToken}`)
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.data.user).toBeDefined();
      });
    });

    it('should reject expired/invalid tokens consistently', async () => {
      const invalidToken = 'invalid.token.here';

      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${invalidToken}`)
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(401);
      });
    });
  });

  // ==================== Database Connection Stability ====================

  describe('Database Connection Stability', () => {
    it('should handle rapid sequential operations', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      for (let i = 0; i < 50; i++) {
        const parent = await createTestProductParent({
          name: `Sequential ${i}`,
          categories: [category._id],
          brand: brand._id,
        });

        await createTestProductVariant({
          parentProduct: parent._id,
          price: 1000 + i,
        });
      }

      const productCount = await ProductParent.countDocuments();
      const variantCount = await ProductVariant.countDocuments();

      expect(productCount).toBe(50);
      expect(variantCount).toBe(50);
    });

    it('should maintain consistency during mixed CRUD operations', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      // Create
      const parent1 = await createTestProductParent({
        name: 'CRUD Test 1',
        categories: [category._id],
        brand: brand._id,
      });
      const parent2 = await createTestProductParent({
        name: 'CRUD Test 2',
        categories: [category._id],
        brand: brand._id,
      });

      // Update
      await request(app)
        .put(`/api/products/parents/${parent1._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CRUD Test 1 Updated' });

      // Delete
      await request(app)
        .delete(`/api/products/parents/${parent2._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Verify
      const products = await ProductParent.find({});
      expect(products.length).toBe(1);
      expect(products[0].name).toBe('CRUD Test 1 Updated');
    });
  });

  // ==================== Long-Running Operations ====================

  describe('Long-Running Operations', () => {
    it('should handle sustained order processing', async () => {
      const variant = await createTestProductVariant({
        stock: 500,
        price: 1000,
      });

      const startTime = Date.now();
      let successCount = 0;

      // Process orders over time
      for (let i = 0; i < 30; i++) {
        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 2 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          });

        if (response.status === 201) {
          successCount++;
        }
      }

      const duration = Date.now() - startTime;

      expect(successCount).toBe(30);
      expect(duration).toBeLessThan(30000); // Within 30 seconds

      // Verify final stock
      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant?.stock).toBe(500 - 60); // 30 orders * 2 quantity
    });
  });
});
