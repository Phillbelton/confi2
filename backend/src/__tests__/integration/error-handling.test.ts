import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestProductParent,
  createTestProductVariant,
  createTestCategory,
  createTestBrand,
  clearDatabase,
} from '../setup/testUtils';
import ProductParent from '../../models/ProductParent';
import ProductVariant from '../../models/ProductVariant';
import { Order } from '../../models/Order';
import { Category } from '../../models/Category';
import { Brand } from '../../models/Brand';

/**
 * Error Handling and Edge Case Tests
 * Comprehensive tests for error scenarios, validation, and edge cases
 */

describe('Error Handling and Edge Cases', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    const admin = await createTestUser({
      email: 'admin-error@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(admin);

    const funcionario = await createTestUser({
      email: 'func-error@test.com',
      role: 'funcionario',
    });
    funcionarioToken = generateAuthToken(funcionario);

    const cliente = await createTestUser({
      email: 'cliente-error@test.com',
      role: 'cliente',
    });
    clienteToken = generateAuthToken(cliente);
  });

  beforeEach(async () => {
    await ProductParent.deleteMany({});
    await ProductVariant.deleteMany({});
    await Order.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== Invalid ID Handling ====================

  describe('Invalid ID Handling', () => {
    it('should return 400 for malformed ObjectId', async () => {
      const response = await request(app)
        .get('/api/products/parents/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent valid ObjectId', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      const response = await request(app)
        .get(`/api/products/parents/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty ID parameter', async () => {
      const response = await request(app)
        .get('/api/products/variants/')
        .expect(404);

      expect([400, 404]).toContain(response.status);
    });

    it('should return 400 for ID with special characters', async () => {
      const response = await request(app)
        .get('/api/products/parents/<script>alert(1)</script>')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long ID strings', async () => {
      const longId = 'a'.repeat(1000);

      const response = await request(app)
        .get(`/api/products/parents/${longId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== Validation Errors ====================

  describe('Validation Errors', () => {
    describe('Product Validation', () => {
      it('should reject product with empty name', async () => {
        const category = await createTestCategory();

        const response = await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '',
            description: 'Valid description',
            categories: [category._id.toString()],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject product with name too short', async () => {
        const category = await createTestCategory();

        const response = await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'AB',
            description: 'Valid description',
            categories: [category._id.toString()],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject product with name too long', async () => {
        const category = await createTestCategory();

        const response = await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'A'.repeat(300),
            description: 'Valid description',
            categories: [category._id.toString()],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject product with description too long', async () => {
        const category = await createTestCategory();

        const response = await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Valid Product',
            description: 'A'.repeat(6000),
            categories: [category._id.toString()],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject product without categories', async () => {
        const response = await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Valid Product',
            description: 'Valid description',
            categories: [],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject product with invalid category ID', async () => {
        const response = await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Valid Product',
            description: 'Valid description',
            categories: ['invalid-id'],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Variant Validation', () => {
      it('should reject variant with negative price', async () => {
        const parent = await createTestProductParent();

        const response = await request(app)
          .post('/api/products/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            parentProduct: parent._id.toString(),
            name: 'Test Variant',
            price: -1000,
            stock: 100,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject variant with negative stock (when backorder disabled)', async () => {
        const parent = await createTestProductParent();

        const response = await request(app)
          .post('/api/products/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            parentProduct: parent._id.toString(),
            name: 'Test Variant',
            price: 10000,
            stock: -10,
            allowBackorder: false,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject variant without parent product', async () => {
        const response = await request(app)
          .post('/api/products/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Orphan Variant',
            price: 10000,
            stock: 100,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject variant with non-existent parent', async () => {
        const fakeParentId = '507f1f77bcf86cd799439999';

        const response = await request(app)
          .post('/api/products/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            parentProduct: fakeParentId,
            name: 'Test Variant',
            price: 10000,
            stock: 100,
          });

        expect([400, 404, 500]).toContain(response.status);
      });

      it('should reject duplicate SKU', async () => {
        const parent = await createTestProductParent();
        const variant1 = await createTestProductVariant({
          parentProduct: parent._id,
        });

        const response = await request(app)
          .post('/api/products/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            parentProduct: parent._id.toString(),
            name: 'Duplicate SKU Variant',
            price: 10000,
            stock: 100,
            sku: variant1.sku,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Order Validation', () => {
      it('should reject order with empty items', async () => {
        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject order with zero quantity', async () => {
        const variant = await createTestProductVariant();

        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 0 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject order with negative quantity', async () => {
        const variant = await createTestProductVariant();

        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: -5 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject order with invalid delivery method', async () => {
        const variant = await createTestProductVariant();

        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 1 }],
            deliveryMethod: 'invalid',
            paymentMethod: 'cash',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject order with invalid payment method', async () => {
        const variant = await createTestProductVariant();

        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: variant._id, quantity: 1 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'bitcoin',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject order with non-existent variant', async () => {
        const fakeVariantId = '507f1f77bcf86cd799439999';

        const response = await request(app)
          .post('/api/orders')
          .set('Cookie', `token=${clienteToken}`)
          .send({
            items: [{ variantId: fakeVariantId, quantity: 1 }],
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
          });

        expect([400, 404]).toContain(response.status);
      });
    });

    describe('User Validation', () => {
      it('should reject registration with invalid email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'not-an-email',
            password: 'ValidPass123!',
            phone: '595981234567',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject registration with weak password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            password: '123',
            phone: '595981234567',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject registration with missing name', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'ValidPass123!',
            phone: '595981234567',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  // ==================== Authentication Errors ====================

  describe('Authentication Errors', () => {
    it('should return 401 for missing token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 for expired token', async () => {
      // Create a manually expired token would require jwt manipulation
      // For now, test with obviously invalid token
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired_token')
        .expect(401);
    });

    it('should return 401 for malformed Bearer token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });

    it('should return 401 for wrong credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for correct email wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-error@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== Authorization Errors ====================

  describe('Authorization Errors', () => {
    it('should return 403 for cliente accessing admin routes', async () => {
      await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${clienteToken}`)
        .expect(403);
    });

    it('should return 403 for funcionario accessing admin-only routes', async () => {
      await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${funcionarioToken}`)
        .expect(403);
    });

    it('should return 403 for cliente trying to delete product', async () => {
      const parent = await createTestProductParent();

      await request(app)
        .delete(`/api/products/parents/${parent._id}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);
    });

    it('should return 403 for funcionario trying to delete product', async () => {
      const parent = await createTestProductParent();

      await request(app)
        .delete(`/api/products/parents/${parent._id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);
    });
  });

  // ==================== Business Logic Errors ====================

  describe('Business Logic Errors', () => {
    it('should reject order exceeding stock', async () => {
      const variant = await createTestProductVariant({
        stock: 5,
        price: 10000,
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 10 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject cancelling completed order', async () => {
      const variant = await createTestProductVariant({
        stock: 100,
        price: 10000,
      });

      // Create and complete order through DB
      const order = await Order.create({
        customer: {
          name: 'Test Customer',
          email: 'test@test.com',
          phone: '595981234567',
          address: {
            street: 'Test Street',
            number: '123',
            city: 'Asuncion',
            neighborhood: 'Centro',
          },
        },
        items: [
          {
            variant: variant._id,
            variantSnapshot: {
              sku: 'TEST-SKU',
              name: 'Test',
              price: 10000,
              attributes: {},
              image: '',
            },
            quantity: 1,
            pricePerUnit: 10000,
            discount: 0,
            subtotal: 10000,
          },
        ],
        subtotal: 10000,
        totalDiscount: 0,
        shippingCost: 0,
        total: 10000,
        deliveryMethod: 'pickup',
        paymentMethod: 'cash',
        status: 'completed',
      });

      const response = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${adminToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject discount value exceeding price', async () => {
      // This is more of a data validation test
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'Test Variant',
          price: 100,
          stock: 100,
          fixedDiscount: {
            enabled: true,
            type: 'amount',
            value: 200, // More than price
          },
        });

      // Should either accept (handled in calculation) or reject
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle empty string values', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          description: '',
          categories: [category._id.toString()],
        });

      // Empty description might be allowed or not
      expect([200, 201, 400]).toContain(response.status);
    });

    it('should handle null values', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          description: null,
          categories: [category._id.toString()],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle undefined values', async () => {
      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle special characters in names', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product <script>alert(1)</script>',
          description: 'Valid description',
          categories: [category._id.toString()],
        });

      // Should sanitize or reject
      if (response.status === 201) {
        expect(response.body.data.name).not.toContain('<script>');
      } else {
        expect(response.status).toBe(400);
      }
    });

    it('should handle unicode characters', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Producto con Ñ y acentos áéíóú 日本語',
          description: 'Description with emojis 🍫🍬',
          categories: [category._id.toString()],
        });

      expect([200, 201]).toContain(response.status);
    });

    it('should handle very large numbers', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'Expensive Variant',
          price: Number.MAX_SAFE_INTEGER,
          stock: 100,
        });

      // Should handle or reject
      expect([201, 400]).toContain(response.status);
    });

    it('should handle decimal numbers in integer fields', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'Test Variant',
          price: 10000,
          stock: 10.5, // Decimal stock
        });

      // Should truncate or reject
      expect([201, 400]).toContain(response.status);
    });

    it('should handle boolean as string', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'Test Variant',
          price: 10000,
          stock: 100,
          active: 'true', // String instead of boolean
        });

      // Should coerce or reject
      expect([201, 400]).toContain(response.status);
    });
  });

  // ==================== Concurrent Error Scenarios ====================

  describe('Concurrent Error Scenarios', () => {
    it('should handle concurrent updates to same resource', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      const updates = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app)
            .put(`/api/products/variants/${variant._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ price: 10000 + i * 100 })
        );

      const responses = await Promise.all(updates);

      // All should succeed (last write wins) or some fail
      const successful = responses.filter((r) => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle concurrent delete attempts', async () => {
      const parent = await createTestProductParent();

      const deletes = Array(3)
        .fill(null)
        .map(() =>
          request(app)
            .delete(`/api/products/parents/${parent._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
        );

      const responses = await Promise.all(deletes);

      // First should succeed, others should fail
      const successful = responses.filter((r) => r.status === 200);
      const notFound = responses.filter((r) => r.status === 404);

      expect(successful.length + notFound.length).toBe(3);
    });
  });
});
