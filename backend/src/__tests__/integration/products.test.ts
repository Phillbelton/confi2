import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestCategory,
  createTestBrand,
  createTestTag,
  createTestProductParent,
  createTestProductVariant,
  clearDatabase,
} from '../setup/testUtils';
import ProductParent from '../../models/ProductParent';
import ProductVariant from '../../models/ProductVariant';

/**
 * Product Integration Tests
 * Tests for ProductParent and ProductVariant endpoints
 */

describe('Product API', () => {
  let adminUser: any;
  let funcionarioUser: any;
  let clienteUser: any;
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    // Create test users with different roles
    adminUser = await createTestUser({
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(adminUser);

    funcionarioUser = await createTestUser({
      name: 'Funcionario User',
      email: 'funcionario@test.com',
      role: 'funcionario',
    });
    funcionarioToken = generateAuthToken(funcionarioUser);

    clienteUser = await createTestUser({
      name: 'Cliente User',
      email: 'cliente@test.com',
      role: 'cliente',
    });
    clienteToken = generateAuthToken(clienteUser);
  });

  beforeEach(async () => {
    // Clear collections before each test, except users
    await ProductParent.deleteMany({});
    await ProductVariant.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== ProductParent Endpoints ====================

  describe('ProductParent - GET /api/products/parents', () => {
    it('should list all active products', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      await createTestProductParent({
        name: 'Product 1',
        categories: [category._id],
        brand: brand._id,
        active: true,
      });

      await createTestProductParent({
        name: 'Product 2',
        categories: [category._id],
        brand: brand._id,
        active: true,
      });

      const response = await request(app)
        .get('/api/products/parents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('slug');
      expect(response.body.data[0]).toHaveProperty('description');
    });

    it('should filter products by category', async () => {
      const category1 = await createTestCategory({ name: 'Category 1' });
      const category2 = await createTestCategory({ name: 'Category 2' });
      const brand = await createTestBrand();

      await createTestProductParent({
        name: 'Product in Cat 1',
        categories: [category1._id],
        brand: brand._id,
      });

      await createTestProductParent({
        name: 'Product in Cat 2',
        categories: [category2._id],
        brand: brand._id,
      });

      const response = await request(app)
        .get('/api/products/parents')
        .query({ category: category1._id.toString() })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Product in Cat 1');
    });

    it('should filter products by brand', async () => {
      const category = await createTestCategory();
      const brand1 = await createTestBrand({ name: 'Brand 1' });
      const brand2 = await createTestBrand({ name: 'Brand 2' });

      await createTestProductParent({
        name: 'Product Brand 1',
        categories: [category._id],
        brand: brand1._id,
      });

      await createTestProductParent({
        name: 'Product Brand 2',
        categories: [category._id],
        brand: brand2._id,
      });

      const response = await request(app)
        .get('/api/products/parents')
        .query({ brand: brand1._id.toString() })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Product Brand 1');
    });

    it('should support pagination with skip and limit', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      for (let i = 1; i <= 5; i++) {
        await createTestProductParent({
          name: `Product ${i}`,
          categories: [category._id],
          brand: brand._id,
        });
      }

      const response = await request(app)
        .get('/api/products/parents')
        .query({ skip: 2, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBe(2);
    });

    it('should search products by name', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      await createTestProductParent({
        name: 'Laptop Dell XPS',
        categories: [category._id],
        brand: brand._id,
      });

      await createTestProductParent({
        name: 'Mouse Logitech',
        categories: [category._id],
        brand: brand._id,
      });

      const response = await request(app)
        .get('/api/products/parents')
        .query({ search: 'Laptop' })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toContain('Laptop');
    });

    it('should not list inactive products', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      await createTestProductParent({
        name: 'Active Product',
        categories: [category._id],
        brand: brand._id,
        active: true,
      });

      await createTestProductParent({
        name: 'Inactive Product',
        categories: [category._id],
        brand: brand._id,
        active: false,
      });

      const response = await request(app)
        .get('/api/products/parents')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Active Product');
    });
  });

  describe('ProductParent - GET /api/products/parents/featured', () => {
    it('should list featured products', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const parent = await createTestProductParent({
        name: 'Featured Product',
        categories: [category._id],
        brand: brand._id,
      });

      // Mark as featured
      await ProductParent.findByIdAndUpdate(parent._id, { featured: true });

      const response = await request(app)
        .get('/api/products/parents/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].featured).toBe(true);
    });

    it('should not list non-featured products', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      await createTestProductParent({
        name: 'Non-Featured Product',
        categories: [category._id],
        brand: brand._id,
        active: true,
      });

      const response = await request(app)
        .get('/api/products/parents/featured')
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });

    it('should support pagination for featured products', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      for (let i = 1; i <= 5; i++) {
        const parent = await createTestProductParent({
          name: `Featured Product ${i}`,
          categories: [category._id],
          brand: brand._id,
        });
        await ProductParent.findByIdAndUpdate(parent._id, { featured: true });
      }

      const response = await request(app)
        .get('/api/products/parents/featured')
        .query({ skip: 0, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBe(2);
    });
  });

  describe('ProductParent - GET /api/products/parents/:id', () => {
    it('should get product by ID with populated references', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const parent = await createTestProductParent({
        name: 'Test Product',
        categories: [category._id],
        brand: brand._id,
      });

      const response = await request(app)
        .get(`/api/products/parents/${parent._id.toString()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', 'Test Product');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('brand');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/products/parents/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/products/parents/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ProductParent - GET /api/products/parents/slug/:slug', () => {
    it('should get product by slug', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const parent = await createTestProductParent({
        name: 'Laptop Test Product',
        categories: [category._id],
        brand: brand._id,
      });

      const response = await request(app)
        .get(`/api/products/parents/slug/${parent.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(parent.slug);
      expect(response.body.data.name).toBe('Laptop Test Product');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/products/parents/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ProductParent - GET /api/products/parents/:id/variants', () => {
    it('should list variants of a product parent', async () => {
      const parent = await createTestProductParent();

      await createTestProductVariant({
        parentProduct: parent._id,
        name: 'Variant 1',
        price: 10000,
      });

      await createTestProductVariant({
        parentProduct: parent._id,
        name: 'Variant 2',
        price: 15000,
      });

      const response = await request(app)
        .get(`/api/products/parents/${parent._id.toString()}/variants`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('price');
      expect(response.body.data[0]).toHaveProperty('sku');
    });

    it('should return empty array if product has no variants', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .get(`/api/products/parents/${parent._id.toString()}/variants`)
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });

    it('should only return active variants', async () => {
      const parent = await createTestProductParent();

      const variant1 = await createTestProductVariant({
        parentProduct: parent._id,
        active: true,
      });

      await createTestProductVariant({
        parentProduct: parent._id,
        active: false,
      });

      const response = await request(app)
        .get(`/api/products/parents/${parent._id.toString()}/variants`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
    });
  });

  describe('ProductParent - POST /api/products/parents', () => {
    it('should create a new product as admin', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Product',
          description: 'Product description here',
          categories: [category._id.toString()],
          brand: brand._id.toString(),
          images: ['/uploads/products/test.jpg'],
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('slug');
      expect(response.body.data.name).toBe('New Product');
      expect(response.body.data.active).toBe(true);

      // Verify in database
      const product = await ProductParent.findById(response.body.data._id);
      expect(product).toBeTruthy();
      expect(product?.name).toBe('New Product');
    });

    it('should create a new product as funcionario', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          name: 'Funcionario Product',
          description: 'Product description',
          categories: [category._id.toString()],
          brand: brand._id.toString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject product creation without authentication', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .send({
          name: 'Unauthorized Product',
          description: 'Description',
          categories: [category._id.toString()],
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject product creation by cliente user', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          name: 'Cliente Product',
          description: 'Description',
          categories: [category._id.toString()],
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject product creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Product',
          // Missing description and categories
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject product creation with invalid name length', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'AB', // Too short
          description: 'Valid description',
          categories: [category._id.toString()],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should auto-generate slug from product name', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product Name',
          description: 'Valid description',
          categories: [category._id.toString()],
        })
        .expect(201);

      expect(response.body.data.slug).toBeTruthy();
      expect(response.body.data.slug).toEqual(
        expect.stringContaining('test-product')
      );
    });
  });

  describe('ProductParent - PUT /api/products/parents/:id', () => {
    it('should update product as admin', async () => {
      const parent = await createTestProductParent({
        name: 'Original Name',
      });

      const response = await request(app)
        .put(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');

      // Verify in database
      const updated = await ProductParent.findById(parent._id);
      expect(updated?.name).toBe('Updated Name');
    });

    it('should update product as funcionario', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .put(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          name: 'Funcionario Update',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject update without authentication', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .put(`/api/products/parents/${parent._id.toString()}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update by cliente user', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .put(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          name: 'Cliente Update',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/products/parents/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should allow partial updates', async () => {
      const parent = await createTestProductParent({
        name: 'Original Name',
      });

      const response = await request(app)
        .put(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          featured: true,
          // Don't update name
        })
        .expect(200);

      expect(response.body.data.featured).toBe(true);
      expect(response.body.data.name).toBe('Original Name');
    });
  });

  describe('ProductParent - DELETE /api/products/parents/:id', () => {
    it('should delete product as admin', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .delete(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deleted = await ProductParent.findById(parent._id);
      expect(deleted).toBeNull();
    });

    it('should reject deletion by funcionario user', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .delete(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify product still exists
      const exists = await ProductParent.findById(parent._id);
      expect(exists).toBeTruthy();
    });

    it('should reject deletion without authentication', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .delete(`/api/products/parents/${parent._id.toString()}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject deletion by cliente user', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .delete(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/products/parents/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should also delete associated variants', async () => {
      const parent = await createTestProductParent();

      await createTestProductVariant({
        parentProduct: parent._id,
      });

      await request(app)
        .delete(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify variants are deleted
      const variants = await ProductVariant.find({
        parentProduct: parent._id,
      });
      expect(variants.length).toBe(0);
    });
  });

  // ==================== ProductVariant Endpoints ====================

  describe('ProductVariant - GET /api/products/variants/:id', () => {
    it('should get variant by ID', async () => {
      const variant = await createTestProductVariant({
        name: 'Test Variant',
        price: 15000,
      });

      const response = await request(app)
        .get(`/api/products/variants/${variant._id.toString()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', 'Test Variant');
      expect(response.body.data).toHaveProperty('price', 15000);
      expect(response.body.data).toHaveProperty('sku');
      expect(response.body.data).toHaveProperty('stock');
    });

    it('should return 404 for non-existent variant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/products/variants/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid variant ID format', async () => {
      const response = await request(app)
        .get('/api/products/variants/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ProductVariant - GET /api/products/variants/sku/:sku', () => {
    it('should get variant by SKU', async () => {
      const variant = await createTestProductVariant({
        name: 'SKU Test Variant',
      });

      const response = await request(app)
        .get(`/api/products/variants/sku/${variant.sku}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe(variant.sku);
    });

    it('should return 404 for non-existent SKU', async () => {
      const response = await request(app)
        .get('/api/products/variants/sku/non-existent-sku')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ProductVariant - GET /api/products/variants/:id/discount-preview', () => {
    it('should get discount preview for variant without discount', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      const response = await request(app)
        .get(
          `/api/products/variants/${variant._id.toString()}/discount-preview`
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('originalPrice', 10000);
      expect(response.body.data).toHaveProperty('hasDiscount');
      expect(response.body.data.hasDiscount).toBe(false);
    });

    it('should get discount preview for variant with percentage discount', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      // Add fixed discount
      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 10,
          badge: 'SALE',
        },
      });

      const response = await request(app)
        .get(
          `/api/products/variants/${variant._id.toString()}/discount-preview`
        )
        .expect(200);

      expect(response.body.data.hasDiscount).toBe(true);
      expect(response.body.data).toHaveProperty('discountedPrice');
      expect(response.body.data).toHaveProperty('discountValue', 10);
      expect(response.body.data).toHaveProperty('discountType', 'percentage');
    });

    it('should get discount preview for variant with amount discount', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      // Add fixed discount
      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'amount',
          value: 2000,
          badge: 'SPECIAL',
        },
      });

      const response = await request(app)
        .get(
          `/api/products/variants/${variant._id.toString()}/discount-preview`
        )
        .expect(200);

      expect(response.body.data.hasDiscount).toBe(true);
      expect(response.body.data.discountValue).toBe(2000);
      expect(response.body.data.discountType).toBe('amount');
    });

    it('should return 404 for non-existent variant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/products/variants/${fakeId}/discount-preview`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ProductVariant - POST /api/products/variants', () => {
    it('should create a new variant as admin', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'New Variant',
          price: 12000,
          stock: 50,
          attributes: { size: 'L', color: 'blue' },
          images: ['/uploads/variants/test.jpg'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('sku');
      expect(response.body.data.name).toBe('New Variant');
      expect(response.body.data.price).toBe(12000);
      expect(response.body.data.stock).toBe(50);

      // Verify in database
      const variant = await ProductVariant.findById(response.body.data._id);
      expect(variant).toBeTruthy();
      expect(variant?.name).toBe('New Variant');
    });

    it('should create a variant as funcionario', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'Funcionario Variant',
          price: 10000,
          stock: 100,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should auto-generate SKU for variant', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'Auto SKU Variant',
          price: 10000,
          stock: 100,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('sku');
      expect(response.body.data.sku).toBeTruthy();
      expect(response.body.data.sku).toMatch(/^[A-Z0-9]+$/);
    });

    it('should reject variant creation without authentication', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .send({
          parentProduct: parent._id.toString(),
          name: 'Unauthorized Variant',
          price: 10000,
          stock: 100,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject variant creation by cliente user', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'Cliente Variant',
          price: 10000,
          stock: 100,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject variant with missing required fields', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id.toString(),
          // Missing name and price
          stock: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject variant with negative price', async () => {
      const parent = await createTestProductParent();

      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id.toString(),
          name: 'Invalid Variant',
          price: -1000,
          stock: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject variant with duplicate SKU', async () => {
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
          sku: variant1.sku, // Duplicate SKU
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ProductVariant - PUT /api/products/variants/:id', () => {
    it('should update variant as admin', async () => {
      const variant = await createTestProductVariant({
        name: 'Original Variant',
        price: 10000,
      });

      const response = await request(app)
        .put(`/api/products/variants/${variant._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Variant',
          price: 12000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Variant');
      expect(response.body.data.price).toBe(12000);

      // Verify in database
      const updated = await ProductVariant.findById(variant._id);
      expect(updated?.name).toBe('Updated Variant');
      expect(updated?.price).toBe(12000);
    });

    it('should update variant as funcionario', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .put(`/api/products/variants/${variant._id.toString()}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          name: 'Funcionario Update',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject update without authentication', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .put(`/api/products/variants/${variant._id.toString()}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update by cliente user', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .put(`/api/products/variants/${variant._id.toString()}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          name: 'Cliente Update',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent variant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/products/variants/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should allow partial updates', async () => {
      const variant = await createTestProductVariant({
        name: 'Original Name',
        price: 10000,
      });

      const response = await request(app)
        .put(`/api/products/variants/${variant._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          active: false,
          // Don't update name or price
        })
        .expect(200);

      expect(response.body.data.active).toBe(false);
      expect(response.body.data.name).toBe('Original Name');
      expect(response.body.data.price).toBe(10000);
    });
  });

  describe('ProductVariant - PATCH /api/products/variants/:id/stock', () => {
    it('should update stock as admin', async () => {
      const variant = await createTestProductVariant({
        stock: 100,
      });

      const response = await request(app)
        .patch(`/api/products/variants/${variant._id.toString()}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 50,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stock).toBe(50);

      // Verify in database
      const updated = await ProductVariant.findById(variant._id);
      expect(updated?.stock).toBe(50);
    });

    it('should update stock as funcionario', async () => {
      const variant = await createTestProductVariant({
        stock: 100,
      });

      const response = await request(app)
        .patch(`/api/products/variants/${variant._id.toString()}/stock`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          stock: 75,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stock).toBe(75);
    });

    it('should reject stock update without authentication', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .patch(`/api/products/variants/${variant._id.toString()}/stock`)
        .send({
          stock: 50,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject stock update by cliente user', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .patch(`/api/products/variants/${variant._id.toString()}/stock`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          stock: 50,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject stock update with negative value', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .patch(`/api/products/variants/${variant._id.toString()}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: -10,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent variant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .patch(`/api/products/variants/${fakeId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 50,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ProductVariant - DELETE /api/products/variants/:id', () => {
    it('should delete variant as admin', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .delete(`/api/products/variants/${variant._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deleted = await ProductVariant.findById(variant._id);
      expect(deleted).toBeNull();
    });

    it('should reject deletion by funcionario user', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .delete(`/api/products/variants/${variant._id.toString()}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify variant still exists
      const exists = await ProductVariant.findById(variant._id);
      expect(exists).toBeTruthy();
    });

    it('should reject deletion without authentication', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .delete(`/api/products/variants/${variant._id.toString()}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject deletion by cliente user', async () => {
      const variant = await createTestProductVariant();

      const response = await request(app)
        .delete(`/api/products/variants/${variant._id.toString()}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent variant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/products/variants/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('ProductVariant - GET /api/products/variants/stock/low', () => {
    it('should list variants with low stock as admin', async () => {
      const variant1 = await createTestProductVariant({
        name: 'Low Stock Variant',
        stock: 5,
        lowStockThreshold: 10,
      });

      const variant2 = await createTestProductVariant({
        name: 'Normal Stock Variant',
        stock: 100,
        lowStockThreshold: 10,
      });

      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify low stock variant is in list
      const lowStockVariants = response.body.data.filter(
        (v: any) => v.name === 'Low Stock Variant'
      );
      expect(lowStockVariants.length).toBe(1);
    });

    it('should list variants with low stock as funcionario', async () => {
      await createTestProductVariant({
        stock: 5,
        lowStockThreshold: 10,
      });

      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject low stock query without authentication', async () => {
      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject low stock query by cliente user', async () => {
      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      for (let i = 1; i <= 5; i++) {
        await createTestProductVariant({
          name: `Low Stock ${i}`,
          stock: 5,
          lowStockThreshold: 10,
        });
      }

      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ skip: 0, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('ProductVariant - GET /api/products/variants/stock/out', () => {
    it('should list out of stock variants as admin', async () => {
      const variant1 = await createTestProductVariant({
        name: 'Out of Stock',
        stock: 0,
      });

      const variant2 = await createTestProductVariant({
        name: 'In Stock',
        stock: 100,
      });

      const response = await request(app)
        .get('/api/products/variants/stock/out')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Verify out of stock variant is in list
      const outOfStock = response.body.data.filter(
        (v: any) => v.name === 'Out of Stock'
      );
      expect(outOfStock.length).toBe(1);
    });

    it('should list out of stock variants as funcionario', async () => {
      await createTestProductVariant({
        stock: 0,
      });

      const response = await request(app)
        .get('/api/products/variants/stock/out')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject out of stock query without authentication', async () => {
      const response = await request(app)
        .get('/api/products/variants/stock/out')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject out of stock query by cliente user', async () => {
      const response = await request(app)
        .get('/api/products/variants/stock/out')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should not include in-stock variants', async () => {
      await createTestProductVariant({
        name: 'In Stock',
        stock: 50,
      });

      const response = await request(app)
        .get('/api/products/variants/stock/out')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const inStock = response.body.data.filter(
        (v: any) => v.name === 'In Stock'
      );
      expect(inStock.length).toBe(0);
    });
  });

  // ==================== Edge Cases and Integration Tests ====================

  describe('Product Edge Cases', () => {
    it('should handle concurrent product creation', async () => {
      const category = await createTestCategory();

      const results = await Promise.all([
        request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Concurrent Product 1',
            description: 'Description 1',
            categories: [category._id.toString()],
          }),
        request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Concurrent Product 2',
            description: 'Description 2',
            categories: [category._id.toString()],
          }),
      ]);

      expect(results[0].status).toBe(201);
      expect(results[1].status).toBe(201);
      expect(results[0].body.data._id).not.toBe(results[1].body.data._id);
    });

    it('should handle special characters in product names', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product with Ñ & Special @#$ Characters',
          description: 'Valid description',
          categories: [category._id.toString()],
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('slug');
    });

    it('should maintain data consistency when updating product with variants', async () => {
      const parent = await createTestProductParent();

      const variant = await createTestProductVariant({
        parentProduct: parent._id,
      });

      // Update parent
      await request(app)
        .put(`/api/products/parents/${parent._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          featured: true,
        })
        .expect(200);

      // Get variant to verify parent relationship
      const response = await request(app)
        .get(`/api/products/variants/${variant._id.toString()}`)
        .expect(200);

      expect(response.body.data.parentProduct).toBeTruthy();
    });

    it('should handle large product descriptions', async () => {
      const category = await createTestCategory();
      const longDescription = 'A'.repeat(4999); // Max length is 5000

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Large Description Product',
          description: longDescription,
          categories: [category._id.toString()],
        })
        .expect(201);

      expect(response.body.data.description).toBe(longDescription);
    });

    it('should reject product description exceeding max length', async () => {
      const category = await createTestCategory();
      const tooLongDescription = 'A'.repeat(5001);

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Oversized Product',
          description: tooLongDescription,
          categories: [category._id.toString()],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should filter products with multiple filters simultaneously', async () => {
      const category1 = await createTestCategory({ name: 'Category 1' });
      const category2 = await createTestCategory({ name: 'Category 2' });
      const brand1 = await createTestBrand({ name: 'Brand 1' });
      const brand2 = await createTestBrand({ name: 'Brand 2' });

      const parent1 = await createTestProductParent({
        name: 'Product A',
        categories: [category1._id],
        brand: brand1._id,
      });

      await createTestProductParent({
        name: 'Product B',
        categories: [category2._id],
        brand: brand2._id,
      });

      const response = await request(app)
        .get('/api/products/parents')
        .query({
          category: category1._id.toString(),
          brand: brand1._id.toString(),
        })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Product A');
    });
  });
});
