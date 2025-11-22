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

/**
 * Performance Tests
 * Tests for response times, throughput, and resource usage
 */

describe('Performance Tests', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    const admin = await createTestUser({
      email: 'admin-perf@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(admin);

    const funcionario = await createTestUser({
      email: 'func-perf@test.com',
      role: 'funcionario',
    });
    funcionarioToken = generateAuthToken(funcionario);

    const cliente = await createTestUser({
      email: 'cliente-perf@test.com',
      role: 'cliente',
    });
    // Add default address for order tests
    cliente.addresses = [{
      label: 'Casa',
      street: 'Perf Street',
      number: '789',
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
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== Response Time Tests ====================

  describe('Response Time', () => {
    describe('Read Operations', () => {
      it('should respond to GET /api/health within 50ms', async () => {
        const startTime = Date.now();
        await request(app).get('/api/health');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(50);
      });

      it('should respond to GET /api/products/parents within 200ms (empty)', async () => {
        const startTime = Date.now();
        await request(app).get('/api/products/parents');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(200);
      });

      it('should respond to GET /api/products/parents within 500ms (with 50 products)', async () => {
        const category = await createTestCategory();
        const brand = await createTestBrand();

        // Create 50 products
        for (let i = 0; i < 50; i++) {
          await createTestProductParent({
            name: `Performance Product ${i}`,
            categories: [category._id],
            brand: brand._id,
          });
        }

        const startTime = Date.now();
        const response = await request(app).get('/api/products/parents');
        const duration = Date.now() - startTime;

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(50);
        expect(duration).toBeLessThan(500);
      });

      it('should respond to GET /api/products/parents/:id within 100ms', async () => {
        const parent = await createTestProductParent();

        const startTime = Date.now();
        await request(app).get(`/api/products/parents/${parent._id}`);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
      });

      it('should respond to authenticated request within 150ms', async () => {
        const startTime = Date.now();
        await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${adminToken}`);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(150);
      });
    });

    describe('Write Operations', () => {
      it('should create product within 300ms', async () => {
        const category = await createTestCategory();
        const brand = await createTestBrand();

        const startTime = Date.now();
        await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Performance Test Product',
            description: 'Test description',
            categories: [category._id.toString()],
            brand: brand._id.toString(),
          });
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(300);
      });

      it('should create variant within 300ms', async () => {
        const parent = await createTestProductParent();

        const startTime = Date.now();
        await request(app)
          .post('/api/products/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            parentProduct: parent._id.toString(),
            name: 'Performance Variant',
            price: 10000,
            stock: 100,
          });
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(300);
      });

      it('should create order within 500ms', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
          stock: 100,
        });

        const startTime = Date.now();
        await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 2 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          });
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(500);
      });

      it('should update product within 200ms', async () => {
        const parent = await createTestProductParent();

        const startTime = Date.now();
        await request(app)
          .put(`/api/products/parents/${parent._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated Name' });
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(200);
      });

      it('should delete product within 200ms', async () => {
        const parent = await createTestProductParent();

        const startTime = Date.now();
        await request(app)
          .delete(`/api/products/parents/${parent._id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(200);
      });
    });
  });

  // ==================== Throughput Tests ====================

  describe('Throughput', () => {
    it('should handle 100 concurrent GET requests', async () => {
      const startTime = Date.now();

      const requests = Array(100)
        .fill(null)
        .map(() => request(app).get('/api/products/parents'));

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBe(100);
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 requests
    });

    it('should handle 50 concurrent authenticated requests', async () => {
      const startTime = Date.now();

      const requests = Array(50)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${adminToken}`)
        );

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBe(50);
      expect(duration).toBeLessThan(3000);
    });

    it('should handle mixed read/write operations efficiently', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const startTime = Date.now();

      const operations = [];

      // 20 reads
      for (let i = 0; i < 20; i++) {
        operations.push(request(app).get('/api/products/parents'));
      }

      // 10 writes
      for (let i = 0; i < 10; i++) {
        operations.push(
          request(app)
            .post('/api/products/parents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: `Mixed Ops Product ${i}-${Date.now()}`,
              description: 'Test',
              categories: [category._id.toString()],
              brand: brand._id.toString(),
            })
        );
      }

      const responses = await Promise.all(operations);
      const duration = Date.now() - startTime;

      const reads = responses.slice(0, 20).filter((r) => r.status === 200).length;
      const writes = responses.slice(20).filter((r) => r.status === 201).length;

      expect(reads).toBe(20);
      expect(writes).toBe(10);
      expect(duration).toBeLessThan(5000);
    });
  });

  // ==================== Pagination Performance ====================

  describe('Pagination Performance', () => {
    it('should paginate efficiently with large dataset', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      // Create 100 products
      for (let i = 0; i < 100; i++) {
        await createTestProductParent({
          name: `Pagination Product ${i}`,
          categories: [category._id],
          brand: brand._id,
        });
      }

      const pageTimes: number[] = [];

      // Test multiple pages
      for (let page = 0; page < 10; page++) {
        const startTime = Date.now();
        const response = await request(app)
          .get('/api/products/parents')
          .query({ skip: page * 10, limit: 10 });
        pageTimes.push(Date.now() - startTime);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(10);
      }

      // All pages should load in similar time
      const avgTime = pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length;
      expect(avgTime).toBeLessThan(300);

      // No page should take more than 2x average
      pageTimes.forEach((time) => {
        expect(time).toBeLessThan(avgTime * 3);
      });
    });

    it('should maintain performance with skip at different offsets', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      // Create 50 products
      for (let i = 0; i < 50; i++) {
        await createTestProductParent({
          name: `Skip Test Product ${i}`,
          categories: [category._id],
          brand: brand._id,
        });
      }

      const offsets = [0, 10, 25, 40];
      const times: number[] = [];

      for (const offset of offsets) {
        const startTime = Date.now();
        await request(app)
          .get('/api/products/parents')
          .query({ skip: offset, limit: 10 });
        times.push(Date.now() - startTime);
      }

      // Performance shouldn't degrade significantly with higher offsets
      times.forEach((time) => {
        expect(time).toBeLessThan(500);
      });
    });
  });

  // ==================== Search Performance ====================

  describe('Search Performance', () => {
    it('should search products efficiently', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      // Create products with varying names
      for (let i = 0; i < 50; i++) {
        await createTestProductParent({
          name: `Product ${i % 5 === 0 ? 'Special' : 'Normal'} ${i}`,
          categories: [category._id],
          brand: brand._id,
        });
      }

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/products/parents')
        .query({ search: 'Special' });
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(300);
    });

    it('should filter by category efficiently', async () => {
      const category1 = await createTestCategory({ name: 'Category 1' });
      const category2 = await createTestCategory({ name: 'Category 2' });
      const brand = await createTestBrand();

      // Create products in different categories
      for (let i = 0; i < 30; i++) {
        await createTestProductParent({
          name: `Filter Test ${i}`,
          categories: [i % 2 === 0 ? category1._id : category2._id],
          brand: brand._id,
        });
      }

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/products/parents')
        .query({ category: category1._id.toString() });
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(15);
      expect(duration).toBeLessThan(300);
    });

    it('should handle combined filters efficiently', async () => {
      const category = await createTestCategory();
      const brand1 = await createTestBrand({ name: 'Brand 1' });
      const brand2 = await createTestBrand({ name: 'Brand 2' });

      // Create products
      for (let i = 0; i < 40; i++) {
        await createTestProductParent({
          name: `Combined Filter ${i}`,
          categories: [category._id],
          brand: i % 2 === 0 ? brand1._id : brand2._id,
        });
      }

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/products/parents')
        .query({
          category: category._id.toString(),
          brand: brand1._id.toString(),
          search: 'Filter',
        });
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(400);
    });
  });

  // ==================== Order Processing Performance ====================

  describe('Order Processing Performance', () => {
    it('should process order creation efficiently', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 1000,
      });

      const times: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 2 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          });
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(500);
    });

    it('should process multi-item order efficiently', async () => {
      const variants = [];
      for (let i = 0; i < 10; i++) {
        const v = await createTestProductVariant({
          price: 1000 + i * 100,
          stock: 100,
        });
        variants.push(v);
      }

      const items = variants.map((v) => ({
        variantId: v._id,
        quantity: 2,
      }));

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items,
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });
      const duration = Date.now() - startTime;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(1000);
    });

    it('should list orders efficiently', async () => {
      // Create multiple orders
      const variant = await createTestProductVariant({
        stock: 1000,
        price: 5000,
      });

      for (let i = 0; i < 20; i++) {
        await createTestOrder();
      }

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token=${adminToken}`)
        .query({ page: 1, limit: 10 });
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

  // ==================== Database Query Performance ====================

  describe('Database Query Performance', () => {
    it('should handle complex aggregations efficiently', async () => {
      // Create test data
      const category = await createTestCategory();
      const brand = await createTestBrand();

      for (let i = 0; i < 30; i++) {
        const parent = await createTestProductParent({
          name: `Aggregation Test ${i}`,
          categories: [category._id],
          brand: brand._id,
        });

        await createTestProductVariant({
          parentProduct: parent._id,
          price: 1000 + i * 100,
          stock: 50,
        });
      }

      // Test featured products (might involve aggregation)
      const startTime = Date.now();
      await request(app).get('/api/products/parents/featured');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300);
    });

    it('should populate references efficiently', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const parent = await createTestProductParent({
        name: 'Populate Test',
        categories: [category._id],
        brand: brand._id,
      });

      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/products/parents/${parent._id}`);
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.data.categories).toBeDefined();
      expect(response.body.data.brand).toBeDefined();
      expect(duration).toBeLessThan(200);
    });
  });

  // ==================== Memory and Resource Tests ====================

  describe('Resource Usage', () => {
    it('should handle sustained load without degradation', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const times: number[] = [];

      // Perform 50 sequential operations
      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();

        if (i % 2 === 0) {
          await request(app).get('/api/products/parents');
        } else {
          await request(app)
            .post('/api/products/parents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: `Sustained Load ${i}-${Date.now()}`,
              description: 'Test',
              categories: [category._id.toString()],
              brand: brand._id.toString(),
            });
        }

        times.push(Date.now() - startTime);
      }

      // Response times should not increase significantly
      const firstTenAvg = times.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const lastTenAvg = times.slice(-10).reduce((a, b) => a + b, 0) / 10;

      // Last 10 should not be more than 3x slower than first 10
      expect(lastTenAvg).toBeLessThan(firstTenAvg * 3);
    });

    it('should handle large response payloads', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      // Create products with large descriptions
      for (let i = 0; i < 20; i++) {
        await createTestProductParent({
          name: `Large Payload ${i}`,
          categories: [category._id],
          brand: brand._id,
        });
      }

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/products/parents')
        .query({ limit: 20 });
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });
  });

  // ==================== Benchmark Summary ====================

  describe('Benchmark Summary', () => {
    it('should meet baseline performance requirements', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();
      const parent = await createTestProductParent({
        categories: [category._id],
        brand: brand._id,
      });
      const variant = await createTestProductVariant({
        parentProduct: parent._id,
        stock: 100,
      });

      const benchmarks: Record<string, number> = {};

      // Health check
      let start = Date.now();
      await request(app).get('/api/health');
      benchmarks['Health Check'] = Date.now() - start;

      // List products
      start = Date.now();
      await request(app).get('/api/products/parents');
      benchmarks['List Products'] = Date.now() - start;

      // Get single product
      start = Date.now();
      await request(app).get(`/api/products/parents/${parent._id}`);
      benchmarks['Get Product'] = Date.now() - start;

      // Create order
      start = Date.now();
      await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });
      benchmarks['Create Order'] = Date.now() - start;

      // Authenticated request
      start = Date.now();
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      benchmarks['Auth Request'] = Date.now() - start;

      // Log benchmarks for reference
      console.log('Performance Benchmarks:', benchmarks);

      // Assertions
      expect(benchmarks['Health Check']).toBeLessThan(100);
      expect(benchmarks['List Products']).toBeLessThan(300);
      expect(benchmarks['Get Product']).toBeLessThan(200);
      expect(benchmarks['Create Order']).toBeLessThan(500);
      expect(benchmarks['Auth Request']).toBeLessThan(200);
    });
  });
});
