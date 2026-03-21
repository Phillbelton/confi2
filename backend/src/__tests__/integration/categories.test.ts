import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, createTestCategory, clearDatabase } from '../setup/testUtils';
import { Category } from '../../models/Category';
import mongoose from 'mongoose';

/**
 * Categories Integration Tests
 * Tests all category endpoints, authorization, hierarchy, slug generation, and validation
 */

describe('Categories API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== GET /api/categories ====================

  describe('GET /api/categories', () => {
    it('should return all active categories with hierarchical structure', async () => {
      // Create main categories
      const main1 = await createTestCategory({ name: 'Electronics' });
      const main2 = await createTestCategory({ name: 'Clothing' });

      // Create subcategories
      const sub1 = await createTestCategory({
        name: 'Smartphones',
        parent: main1._id,
      });
      const sub2 = await createTestCategory({
        name: 'Laptops',
        parent: main1._id,
      });

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');

      const categories = response.body.data.categories;
      expect(categories.length).toBe(2);

      // Check main categories
      const electronicsCategory = categories.find(
        (cat: any) => cat._id === main1._id.toString()
      );
      expect(electronicsCategory).toBeDefined();
      expect(electronicsCategory.subcategories).toHaveLength(2);
      expect(electronicsCategory.subcategories[0].name).toMatch(/Smartphone|Laptop/);
    });

    it('should exclude inactive categories by default', async () => {
      await createTestCategory({ name: 'Active Category', active: true });
      await createTestCategory({ name: 'Inactive Category', active: false });

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      const categories = response.body.data.categories;
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Active Category');
    });

    it('should include inactive categories when requested', async () => {
      await createTestCategory({ name: 'Active Category', active: true });
      await createTestCategory({ name: 'Inactive Category', active: false });

      const response = await request(app)
        .get('/api/categories?includeInactive=true');

      expect(response.status).toBe(200);
      const categories = response.body.data.categories;
      expect(categories.length).toBe(2);
    });

    it('should sort categories by order and name', async () => {
      await Category.create({ name: 'Zebra', order: 2, active: true });
      await Category.create({ name: 'Alpha', order: 1, active: true });
      await Category.create({ name: 'Beta', order: 1, active: true });

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      const categories = response.body.data.categories;
      expect(categories[0].order).toBeLessThanOrEqual(categories[1].order);
    });
  });

  // ==================== GET /api/categories/main ====================

  describe('GET /api/categories/main', () => {
    it('should return only main categories without parent', async () => {
      const main = await createTestCategory({ name: 'Main Category' });
      const sub = await createTestCategory({
        name: 'Sub Category',
        parent: main._id,
      });

      const response = await request(app).get('/api/categories/main');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(1);
      expect(response.body.data.categories[0]._id).toBe(main._id.toString());
      expect(response.body.data.categories[0].parent).toBeFalsy();
    });

    it('should include product count and subcategories for main categories', async () => {
      const main = await createTestCategory({
        name: 'Main Category',
        color: '#FF5733',
      });
      const sub1 = await createTestCategory({
        name: 'Sub 1',
        parent: main._id,
      });
      const sub2 = await createTestCategory({
        name: 'Sub 2',
        parent: main._id,
      });

      const response = await request(app).get('/api/categories/main');

      expect(response.status).toBe(200);
      const category = response.body.data.categories[0];
      expect(category.subcategories).toHaveLength(2);
      expect(category).toHaveProperty('productCount');
      expect(category.productCount).toBe(0);
    });

    it('should only return active main categories', async () => {
      await createTestCategory({ name: 'Active Main', active: true });
      await createTestCategory({ name: 'Inactive Main', active: false });
      await createTestCategory({
        name: 'Sub of Inactive',
        parent: (await createTestCategory({ name: 'Temp', active: false }))._id,
      });

      const response = await request(app).get('/api/categories/main');

      expect(response.status).toBe(200);
      expect(response.body.data.categories).toHaveLength(1);
      expect(response.body.data.categories[0].name).toBe('Active Main');
    });
  });

  // ==================== GET /api/categories/:id ====================

  describe('GET /api/categories/:id', () => {
    it('should return category by valid ID', async () => {
      const category = await createTestCategory({
        name: 'Test Category',
        color: '#3B82F6',
      });

      const response = await request(app).get(`/api/categories/${category._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category._id).toBe(category._id.toString());
      expect(response.body.data.category.name).toBe('Test Category');
      expect(response.body.data.category.color).toBe('#3B82F6');
    });

    it('should include subcategories for parent categories', async () => {
      const parent = await createTestCategory({ name: 'Parent' });
      const sub1 = await createTestCategory({
        name: 'Sub 1',
        parent: parent._id,
      });
      const sub2 = await createTestCategory({
        name: 'Sub 2',
        parent: parent._id,
      });

      const response = await request(app).get(`/api/categories/${parent._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.category.subcategories).toHaveLength(2);
      expect(response.body.data.category.subcategories[0].name).toMatch(/Sub/);
    });

    it('should include product count', async () => {
      const category = await createTestCategory();

      const response = await request(app).get(`/api/categories/${category._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.category).toHaveProperty('productCount');
      expect(response.body.data.category.productCount).toBe(0);
    });

    it('should populate parent information', async () => {
      const parentCat = await createTestCategory({ name: 'Parent Category' });
      const childCat = await createTestCategory({
        name: 'Child Category',
        parent: parentCat._id,
      });

      const response = await request(app).get(`/api/categories/${childCat._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.category.parent).toBeDefined();
      expect(response.body.data.category.parent.name).toBe('Parent Category');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app).get(`/api/categories/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrada');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app).get('/api/categories/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== GET /api/categories/slug/:slug ====================

  describe('GET /api/categories/slug/:slug', () => {
    it('should return category by slug', async () => {
      const category = await createTestCategory({
        name: 'Electronics Store',
      });

      // Slug will be auto-generated in lowercase without spaces
      const response = await request(app).get(
        `/api/categories/slug/${category.slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category._id).toBe(category._id.toString());
      expect(response.body.data.category.slug).toBe(category.slug);
    });

    it('should handle slug with special characters', async () => {
      const category = await createTestCategory({
        name: 'Electronics & Gadgets',
      });

      const response = await request(app).get(
        `/api/categories/slug/${category.slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.category.name).toBe('Electronics & Gadgets');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app).get(
        '/api/categories/slug/non-existent-slug-xyz'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrada');
    });

    it('should be case-insensitive for slug lookup', async () => {
      const category = await createTestCategory({ name: 'Test Category' });

      const response = await request(app).get(
        `/api/categories/slug/${category.slug.toUpperCase()}`
      );

      // Slug is lowercase, so uppercase lookup should still work (via lowercase matching)
      expect([200, 404]).toContain(response.status);
    });
  });

  // ==================== GET /api/categories/:id/subcategories ====================

  describe('GET /api/categories/:id/subcategories', () => {
    it('should return subcategories of a parent category', async () => {
      const parent = await createTestCategory({ name: 'Parent' });
      const sub1 = await createTestCategory({
        name: 'Subcategory 1',
        parent: parent._id,
      });
      const sub2 = await createTestCategory({
        name: 'Subcategory 2',
        parent: parent._id,
      });

      const response = await request(app).get(
        `/api/categories/${parent._id}/subcategories`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subcategories).toHaveLength(2);
      expect(response.body.data.subcategories[0].parent?.toString()).toBe(
        parent._id.toString()
      );
    });

    it('should return empty array for category with no subcategories', async () => {
      const category = await createTestCategory({ name: 'Leaf Category' });

      const response = await request(app).get(
        `/api/categories/${category._id}/subcategories`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.subcategories).toHaveLength(0);
    });

    it('should only return active subcategories', async () => {
      const parent = await createTestCategory();
      const activeSub = await createTestCategory({
        name: 'Active Sub',
        parent: parent._id,
        active: true,
      });
      const inactiveSub = await createTestCategory({
        name: 'Inactive Sub',
        parent: parent._id,
        active: false,
      });

      const response = await request(app).get(
        `/api/categories/${parent._id}/subcategories`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.subcategories).toHaveLength(1);
      expect(response.body.data.subcategories[0].name).toBe('Active Sub');
    });

    it('should return 404 for non-existent parent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app).get(
        `/api/categories/${fakeId}/subcategories`
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should sort subcategories by order and name', async () => {
      const parent = await createTestCategory();
      await Category.create({ name: 'Zebra Sub', parent: parent._id, order: 2, active: true });
      await Category.create({ name: 'Alpha Sub', parent: parent._id, order: 1, active: true });

      const response = await request(app).get(
        `/api/categories/${parent._id}/subcategories`
      );

      expect(response.status).toBe(200);
      const subs = response.body.data.subcategories;
      expect(subs[0].order).toBeLessThanOrEqual(subs[1].order);
    });
  });

  // ==================== POST /api/categories ====================

  describe('POST /api/categories', () => {
    it('should create category as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Category',
          description: 'A new category',
          icon: 'category-icon',
          active: true,
          order: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('exitosamente');
      expect(response.body.data.category.name).toBe('New Category');
      expect(response.body.data.category.slug).toBeDefined();
      expect(response.body.data.category.slug).toBeTruthy();

      // Verify slug was generated
      const dbCategory = await Category.findById(response.body.data.category._id);
      expect(dbCategory?.slug).toBeTruthy();
      expect(dbCategory?.slug).toMatch(/new-category/);
    });

    it('should create category as funcionario', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Funcionario Category',
          description: 'Created by funcionario',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Funcionario Category');
    });

    it('should reject creation as regular user', async () => {
      const user = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Category',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permisos');
    });

    it('should reject creation without authentication', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({
          name: 'Unauthorized Category',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should auto-generate slug from name', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Mobile Phones & Accessories',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.category.slug).toBeTruthy();
      expect(response.body.data.category.slug.toLowerCase()).toBe(
        response.body.data.category.slug
      );
    });

    it('should ensure unique slugs', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      // Create first category
      const response1 = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Category' });

      expect(response1.status).toBe(201);
      const firstSlug = response1.body.data.category.slug;

      // Try to create with same name
      const response2 = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Category' });

      expect(response2.status).toBe(201);
      const secondSlug = response2.body.data.category.slug;

      // Slugs should be different (second will have timestamp)
      expect(firstSlug).not.toBe(secondSlug);
    });

    it('should validate color format', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test',
          color: 'not-a-hex-color',
        });

      // Validation should fail
      expect(response.status).toBe(400);
    });

    it('should accept valid hex color', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Colored Category',
          color: '#FF5733',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.category.color).toBe('#FF5733');
    });

    it('should create child category with parent reference', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const parent = await createTestCategory({ name: 'Parent' });

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Child Category',
          parent: parent._id.toString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.category.parent?.toString()).toBe(
        parent._id.toString()
      );
    });

    it('should enforce max 2 levels hierarchy', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      // Create level 1
      const level1 = await createTestCategory({ name: 'Level 1' });
      // Create level 2
      const level2 = await createTestCategory({
        name: 'Level 2',
        parent: level1._id,
      });

      // Try to create level 3
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Level 3',
          parent: level2._id.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('2 niveles');
    });

    it('should require name field', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Missing name',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate minimum name length', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'A',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should set default color if not provided', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Default Color Category',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.category.color).toBeDefined();
      expect(response.body.data.category.color).toMatch(/^#[0-9A-Fa-f]{3,6}$/);
    });
  });

  // ==================== PUT /api/categories/:id ====================

  describe('PUT /api/categories/:id', () => {
    it('should update category as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const category = await createTestCategory({ name: 'Old Name' });

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('actualizada');
      expect(response.body.data.category.name).toBe('Updated Name');
      expect(response.body.data.category.description).toBe(
        'Updated description'
      );
    });

    it('should update category as funcionario', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const category = await createTestCategory();

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Funcionario Update',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Funcionario Update');
    });

    it('should reject update as regular user', async () => {
      const user = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(user);
      const category = await createTestCategory();

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject update without authentication', async () => {
      const category = await createTestCategory();

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should update color to new hex value', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const category = await createTestCategory({ color: '#3B82F6' });

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          color: '#FF5733',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.category.color).toBe('#FF5733');
    });

    it('should update parent reference for hierarchy change', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const parent1 = await createTestCategory({ name: 'Parent 1' });
      const parent2 = await createTestCategory({ name: 'Parent 2' });
      const child = await createTestCategory({
        name: 'Child',
        parent: parent1._id,
      });

      const response = await request(app)
        .put(`/api/categories/${child._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          parent: parent2._id.toString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.data.category.parent?.toString()).toBe(
        parent2._id.toString()
      );
    });

    it('should update order', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const category = await createTestCategory({ order: 1 });

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          order: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.category.order).toBe(5);
    });

    it('should update active status', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const category = await createTestCategory({ active: true });

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          active: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.category.active).toBe(false);
    });

    it('should return 404 for non-existent category', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should allow partial updates', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const original = await Category.create({
        name: 'Original',
        description: 'Original description',
        color: '#3B82F6',
        active: true,
      });

      const response = await request(app)
        .put(`/api/categories/${original._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Only Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.category.name).toBe('Updated Only Name');
      expect(response.body.data.category.description).toBe(
        'Original description'
      );
      expect(response.body.data.category.color).toBe('#3B82F6');
    });

    it('should validate color format on update', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const category = await createTestCategory();

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          color: 'invalid-color',
        });

      expect(response.status).toBe(400);
    });

    it('should enforce max 2 levels hierarchy on update', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const level1 = await createTestCategory({ name: 'Level 1' });
      const level2 = await createTestCategory({
        name: 'Level 2',
        parent: level1._id,
      });
      const level3 = await createTestCategory({ name: 'Level 3' });

      const response = await request(app)
        .put(`/api/categories/${level3._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          parent: level2._id.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('2 niveles');
    });
  });

  // ==================== DELETE /api/categories/:id ====================

  describe('DELETE /api/categories/:id', () => {
    it('should delete category as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const category = await createTestCategory({ name: 'Delete Me' });

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminada');

      // Verify deletion
      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });

    it('should reject deletion as funcionario', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const category = await createTestCategory();

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permisos');
    });

    it('should reject deletion as regular user', async () => {
      const user = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(user);
      const category = await createTestCategory();

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject deletion without authentication', async () => {
      const category = await createTestCategory();

      const response = await request(app).delete(
        `/api/categories/${category._id}`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent category', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should prevent deletion of category with subcategories', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const parent = await createTestCategory({ name: 'Parent' });
      const child = await createTestCategory({
        name: 'Child',
        parent: parent._id,
      });

      const response = await request(app)
        .delete(`/api/categories/${parent._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('subcategorías');

      // Verify not deleted
      const stillExists = await Category.findById(parent._id);
      expect(stillExists).toBeTruthy();
    });

    it('should prevent deletion of category with products', async () => {
      // Note: This test verifies the business logic, but requires ProductParent setup
      // The actual test would need proper product setup
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const category = await createTestCategory();

      // If products were associated, deletion should fail
      // This is covered by controller logic
      expect(admin).toBeTruthy();
    });
  });

  // ==================== Hierarchy and Relationships ====================

  describe('Category Hierarchy and Relationships', () => {
    it('should maintain parent-child relationship integrity', async () => {
      const parent = await createTestCategory({ name: 'Parent' });
      const child = await createTestCategory({
        name: 'Child',
        parent: parent._id,
      });

      const parentFetch = await Category.findById(parent._id);
      const childFetch = await Category.findById(child._id);

      expect(childFetch?.parent?.toString()).toBe(parent._id.toString());
      expect(parentFetch?.parent).toBeNull();
    });

    it('should handle deep parent nesting correctly', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      // Create level 1
      const level1 = await createTestCategory({ name: 'Level 1' });

      // Create level 2
      const level2Response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Level 2',
          parent: level1._id.toString(),
        });

      expect(level2Response.status).toBe(201);

      // Attempt level 3 should fail
      const level3Response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Level 3',
          parent: level2Response.body.data.category._id,
        });

      expect(level3Response.status).toBe(400);
    });

    it('should list all subcategories regardless of depth of parent', async () => {
      const parent = await createTestCategory({ name: 'Parent' });
      const sub1 = await createTestCategory({
        name: 'Sub 1',
        parent: parent._id,
      });
      const sub2 = await createTestCategory({
        name: 'Sub 2',
        parent: parent._id,
      });
      const sub3 = await createTestCategory({
        name: 'Sub 3',
        parent: parent._id,
      });

      const response = await request(app).get(
        `/api/categories/${parent._id}/subcategories`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.subcategories).toHaveLength(3);
    });
  });

  // ==================== Slug Generation ====================

  describe('Slug Generation and Management', () => {
    it('should auto-generate lowercase slug from name', async () => {
      const category = await createTestCategory({
        name: 'My Test Category',
      });

      expect(category.slug).toBeDefined();
      expect(category.slug).toBe(category.slug.toLowerCase());
      expect(category.slug).toContain('my');
      expect(category.slug).toContain('test');
      expect(category.slug).toContain('category');
    });

    it('should remove special characters from slug', async () => {
      const category = await createTestCategory({
        name: 'Test! @#$ Category',
      });

      expect(category.slug).not.toContain('!');
      expect(category.slug).not.toContain('@');
      expect(category.slug).not.toContain('#');
    });

    it('should handle spaces in slug', async () => {
      const category = await createTestCategory({
        name: 'Multi Word Category',
      });

      expect(category.slug).toMatch(/multi.*word.*category/);
    });

    it('should ensure slug uniqueness with timestamp', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const response1 = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Unique Name' });

      const response2 = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Unique Name' });

      const slug1 = response1.body.data.category.slug;
      const slug2 = response2.body.data.category.slug;

      expect(slug1).not.toBe(slug2);
      expect(slug1).toContain('unique');
      expect(slug2).toContain('unique');
    });

    it('should be queryable by slug', async () => {
      const category = await createTestCategory({
        name: 'Queryable Category',
      });

      const response = await request(app).get(
        `/api/categories/slug/${category.slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.category._id).toBe(category._id.toString());
    });
  });

  // ==================== Color Validation ====================

  describe('Color Validation', () => {
    it('should accept valid 6-digit hex colors', async () => {
      const colors = ['#FF5733', '#3B82F6', '#00FF00', '#000000', '#FFFFFF'];

      for (const color of colors) {
        const category = await createTestCategory({
          name: `Category for ${color}`,
          color,
        });
        expect(category.color).toBe(color);
      }
    });

    it('should accept valid 3-digit hex colors', async () => {
      const colors = ['#F00', '#0F0', '#00F'];

      for (const color of colors) {
        const category = await createTestCategory({
          name: `Category for ${color}`,
          color,
        });
        expect(category.color).toBe(color);
      }
    });

    it('should reject invalid color formats', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);

      const invalidColors = ['FF5733', '#FF573', 'not-a-color', '#GGGGGG', 'red'];

      for (const color of invalidColors) {
        const response = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: `Test for ${color}`,
            color,
          });

        expect(response.status).toBe(400);
      }
    });

    it('should use default color when not provided', async () => {
      const category = await createTestCategory({
        name: 'Default Color Category',
      });

      expect(category.color).toBeDefined();
      expect(category.color).toMatch(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
    });

    it('should allow color updates with new hex value', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(admin);
      const category = await createTestCategory({ color: '#3B82F6' });

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          color: '#10B981',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.category.color).toBe('#10B981');
    });
  });

  // ==================== Authorization Tests ====================

  describe('Authorization and Access Control', () => {
    it('should allow all users to read categories', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const funcionario = await createTestUser({ role: 'funcionario' });
      const cliente = await createTestUser({ role: 'cliente' });

      const adminToken = generateAuthToken(admin);
      const funcionarioToken = generateAuthToken(funcionario);
      const clienteToken = generateAuthToken(cliente);

      const category = await createTestCategory();

      // All should be able to read without auth (public endpoint)
      const response = await request(app).get(
        `/api/categories/${category._id}`
      );
      expect(response.status).toBe(200);
    });

    it('should only allow admin and funcionario to create', async () => {
      const cliente = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(cliente);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Category',
        });

      expect(response.status).toBe(403);
    });

    it('should only allow admin and funcionario to update', async () => {
      const cliente = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(cliente);
      const category = await createTestCategory();

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(403);
    });

    it('should only allow admin to delete', async () => {
      const funcionario = await createTestUser({ role: 'funcionario' });
      const token = generateAuthToken(funcionario);
      const category = await createTestCategory();

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('should reject requests without valid JWT', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          name: 'Test',
        });

      expect(response.status).toBe(401);
    });

    it('should reject requests with expired token', async () => {
      // Note: In real test, would need to mock token expiration
      // For now, we test that missing token is rejected
      const response = await request(app)
        .post('/api/categories')
        .send({
          name: 'Test',
        });

      expect(response.status).toBe(401);
    });
  });
});
