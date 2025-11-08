import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, createTestBrand, createTestProductParent, clearDatabase } from '../setup/testUtils';
import { testUsers, testBrands } from '../setup/testFixtures';
import { Brand } from '../../models/Brand';
import mongoose from 'mongoose';

/**
 * Brands API Integration Tests
 * Tests all brand endpoints, authorization, slug generation, validation, and soft delete
 */

describe('Brands API', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;
  let adminUser: any;
  let funcionarioUser: any;
  let clienteUser: any;

  beforeAll(async () => {
    // Create test users
    adminUser = await createTestUser({
      name: testUsers.admin.name,
      email: testUsers.admin.email,
      password: testUsers.admin.password,
      role: testUsers.admin.role,
      phone: testUsers.admin.phone,
    });

    funcionarioUser = await createTestUser({
      name: testUsers.funcionario.name,
      email: testUsers.funcionario.email,
      password: testUsers.funcionario.password,
      role: testUsers.funcionario.role,
      phone: testUsers.funcionario.phone,
    });

    clienteUser = await createTestUser({
      name: testUsers.cliente.name,
      email: testUsers.cliente.email,
      password: testUsers.cliente.password,
      role: testUsers.cliente.role,
      phone: testUsers.cliente.phone,
    });

    // Generate tokens
    adminToken = generateAuthToken(adminUser);
    funcionarioToken = generateAuthToken(funcionarioUser);
    clienteToken = generateAuthToken(clienteUser);
  });

  beforeEach(async () => {
    // Clear database before each test (but keep users)
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (key !== 'users') {
        await collections[key].deleteMany({});
      }
    }
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== GET /api/brands (List All) ====================

  describe('GET /api/brands', () => {
    it('should return all active brands', async () => {
      // Create test brands
      await createTestBrand({ name: 'Brand One' });
      await createTestBrand({ name: 'Brand Two' });
      await createTestBrand({ name: 'Brand Three' });

      const response = await request(app).get('/api/brands');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.brands).toBeDefined();
      expect(response.body.data.brands).toHaveLength(3);
      expect(response.body.data.brands[0]).toHaveProperty('name');
      expect(response.body.data.brands[0]).toHaveProperty('slug');
      expect(response.body.data.brands[0]).toHaveProperty('active');
    });

    it('should return empty array when no brands exist', async () => {
      const response = await request(app).get('/api/brands');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.brands).toEqual([]);
    });

    it('should exclude inactive brands by default', async () => {
      await createTestBrand({ name: 'Active Brand', active: true });
      await createTestBrand({ name: 'Inactive Brand', active: false });

      const response = await request(app).get('/api/brands');

      expect(response.status).toBe(200);
      expect(response.body.data.brands).toHaveLength(1);
      expect(response.body.data.brands[0].name).toBe('Active Brand');
    });

    it('should include inactive brands when requested', async () => {
      await createTestBrand({ name: 'Active Brand', active: true });
      await createTestBrand({ name: 'Inactive Brand', active: false });

      const response = await request(app).get('/api/brands?includeInactive=true');

      expect(response.status).toBe(200);
      expect(response.body.data.brands).toHaveLength(2);
    });

    it('should sort brands by name ascending', async () => {
      await createTestBrand({ name: 'Zebra Brand' });
      await createTestBrand({ name: 'Apple Brand' });
      await createTestBrand({ name: 'Mango Brand' });

      const response = await request(app).get('/api/brands');

      expect(response.status).toBe(200);
      expect(response.body.data.brands[0].name).toBe('Apple Brand');
      expect(response.body.data.brands[1].name).toBe('Mango Brand');
      expect(response.body.data.brands[2].name).toBe('Zebra Brand');
    });

    it('should be accessible without authentication', async () => {
      await createTestBrand({ name: 'Public Brand' });

      const response = await request(app).get('/api/brands');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==================== GET /api/brands/:id ====================

  describe('GET /api/brands/:id', () => {
    it('should return a brand by ID with product count', async () => {
      const brand = await createTestBrand({ name: 'Brand with Products' });
      await createTestProductParent({ brand: brand._id as mongoose.Types.ObjectId });

      const response = await request(app).get(`/api/brands/${brand._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.brand).toBeDefined();
      expect(response.body.data.brand._id).toBe(brand._id.toString());
      expect(response.body.data.brand.name).toBe('Brand with Products');
      expect(response.body.data.brand.productCount).toBe(1);
    });

    it('should return brand with zero product count', async () => {
      const brand = await createTestBrand({ name: 'Brand no Products' });

      const response = await request(app).get(`/api/brands/${brand._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.brand.productCount).toBe(0);
    });

    it('should return 404 for non-existent brand', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app).get(`/api/brands/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrada');
    });

    it('should return 400 for invalid brand ID format', async () => {
      const response = await request(app).get('/api/brands/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return brand properties correctly', async () => {
      const brand = await createTestBrand({
        name: 'Complete Brand Data',
        active: true,
      });

      const response = await request(app).get(`/api/brands/${brand._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.brand).toHaveProperty('_id');
      expect(response.body.data.brand).toHaveProperty('name');
      expect(response.body.data.brand).toHaveProperty('slug');
      expect(response.body.data.brand).toHaveProperty('logo');
      expect(response.body.data.brand).toHaveProperty('active');
      expect(response.body.data.brand).toHaveProperty('createdAt');
      expect(response.body.data.brand).toHaveProperty('updatedAt');
      expect(response.body.data.brand).toHaveProperty('productCount');
    });

    it('should be accessible without authentication', async () => {
      const brand = await createTestBrand({ name: 'Public Brand' });

      const response = await request(app).get(`/api/brands/${brand._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==================== GET /api/brands/slug/:slug ====================

  describe('GET /api/brands/slug/:slug', () => {
    it('should return a brand by slug', async () => {
      const brand = await createTestBrand({ name: 'Nike Sports' });
      // The slug should be auto-generated: "nike-sports"

      const response = await request(app).get(`/api/brands/slug/${brand.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.brand).toBeDefined();
      expect(response.body.data.brand.name).toBe('Nike Sports');
      expect(response.body.data.brand.slug).toBe(brand.slug);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app).get('/api/brands/slug/non-existent-slug');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should only return active brands by slug', async () => {
      const brand = await createTestBrand({ name: 'Inactive Brand', active: false });

      const response = await request(app).get(`/api/brands/slug/${brand.slug}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should generate correct slug from brand name', async () => {
      const brand = await createTestBrand({ name: 'Pepsi Colombia' });

      const response = await request(app).get(`/api/brands/slug/${brand.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.data.brand.name).toBe('Pepsi Colombia');
      // Slug should be lowercase and slugified
      expect(response.body.data.brand.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should handle accented characters in slug', async () => {
      const brand = await createTestBrand({ name: 'Café Artesanal' });

      const response = await request(app).get(`/api/brands/slug/${brand.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.data.brand.name).toBe('Café Artesanal');
    });

    it('should include product count with slug query', async () => {
      const brand = await createTestBrand({ name: 'ProductBrand' });
      await createTestProductParent({ brand: brand._id as mongoose.Types.ObjectId });

      const response = await request(app).get(`/api/brands/slug/${brand.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.data.brand.productCount).toBe(1);
    });

    it('should be accessible without authentication', async () => {
      const brand = await createTestBrand({ name: 'Public Brand' });

      const response = await request(app).get(`/api/brands/slug/${brand.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==================== POST /api/brands (Create) ====================

  describe('POST /api/brands', () => {
    it('should create a brand as admin', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Brand Admin',
          logo: 'https://example.com/logo.jpg',
          active: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Marca creada exitosamente');
      expect(response.body.data.brand).toBeDefined();
      expect(response.body.data.brand.name).toBe('New Brand Admin');
      expect(response.body.data.brand.slug).toBeDefined();
      expect(response.body.data.brand.active).toBe(true);
    });

    it('should create a brand as funcionario', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          name: 'New Brand Funcionario',
          logo: 'https://example.com/func-logo.jpg',
          active: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.brand.name).toBe('New Brand Funcionario');
    });

    it('should reject brand creation by cliente (insufficient role)', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          name: 'Unauthorized Brand',
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated brand creation request', async () => {
      const response = await request(app)
        .post('/api/brands')
        .send({
          name: 'Unauthorized Brand',
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should auto-generate slug from name', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Best Brand Ever',
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.brand.slug).toBeDefined();
      expect(response.body.data.brand.slug).toBe('best-brand-ever');
    });

    it('should default active to true if not provided', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Default Active Brand',
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.brand.active).toBe(true);
    });

    it('should allow setting active to false on creation', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Inactive Brand',
          logo: 'https://example.com/logo.jpg',
          active: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.brand.active).toBe(false);
    });

    it('should reject brand creation with missing name', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject brand name less than 2 characters', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A',
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject brand name exceeding 100 characters', async () => {
      const longName = 'A'.repeat(101);

      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: longName,
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid logo URL', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Brand with Bad URL',
          logo: 'not-a-url',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate brand name', async () => {
      await createTestBrand({ name: 'Unique Brand' });

      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Unique Brand',
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should trim whitespace from brand name', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '  Brand With Spaces  ',
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.brand.name).toBe('Brand With Spaces');
    });

    it('should be created in database', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'DB Test Brand',
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(201);

      const dbBrand = await Brand.findOne({ name: 'DB Test Brand' });
      expect(dbBrand).toBeTruthy();
      expect(dbBrand?.name).toBe('DB Test Brand');
      expect(dbBrand?.slug).toBe('db-test-brand');
    });
  });

  // ==================== PUT /api/brands/:id (Update) ====================

  describe('PUT /api/brands/:id', () => {
    it('should update a brand as admin', async () => {
      const brand = await createTestBrand({ name: 'Original Name' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          logo: 'https://example.com/new-logo.jpg',
          active: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Marca actualizada exitosamente');
      expect(response.body.data.brand.name).toBe('Updated Name');
      expect(response.body.data.brand.active).toBe(false);
    });

    it('should update a brand as funcionario', async () => {
      const brand = await createTestBrand({ name: 'Original' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          name: 'Updated by Funcionario',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.brand.name).toBe('Updated by Funcionario');
    });

    it('should reject brand update by cliente', async () => {
      const brand = await createTestBrand({ name: 'Original' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated brand update', async () => {
      const brand = await createTestBrand({ name: 'Original' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should update only specified fields', async () => {
      const originalBrand = await createTestBrand({
        name: 'Original Brand',
        active: true,
      });

      const response = await request(app)
        .put(`/api/brands/${originalBrand._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name Only',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.brand.name).toBe('Updated Name Only');
      expect(response.body.data.brand.active).toBe(true); // Should remain unchanged
    });

    it('should regenerate slug when name is updated', async () => {
      const brand = await createTestBrand({ name: 'Old Name' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Name Changed',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.brand.slug).toBe('new-name-changed');
    });

    it('should return 404 for non-existent brand', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/brands/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid name length on update', async () => {
      const brand = await createTestBrand({ name: 'Valid Brand' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid logo URL on update', async () => {
      const brand = await createTestBrand({ name: 'Valid Brand' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          logo: 'invalid-url',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should update in database', async () => {
      const brand = await createTestBrand({ name: 'Before Update' });

      await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'After Update',
          active: false,
        });

      const updatedBrand = await Brand.findById(brand._id);
      expect(updatedBrand?.name).toBe('After Update');
      expect(updatedBrand?.active).toBe(false);
    });
  });

  // ==================== DELETE /api/brands/:id (Soft Delete) ====================

  describe('DELETE /api/brands/:id', () => {
    it('should soft delete a brand as admin', async () => {
      const brand = await createTestBrand({ name: 'Brand to Delete' });

      const response = await request(app)
        .delete(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Marca eliminada exitosamente');
    });

    it('should reject brand deletion by funcionario', async () => {
      const brand = await createTestBrand({ name: 'Brand to Delete' });

      const response = await request(app)
        .delete(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject brand deletion by cliente', async () => {
      const brand = await createTestBrand({ name: 'Brand to Delete' });

      const response = await request(app)
        .delete(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated brand deletion', async () => {
      const brand = await createTestBrand({ name: 'Brand to Delete' });

      const response = await request(app).delete(`/api/brands/${brand._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should perform soft delete (set active to false)', async () => {
      const brand = await createTestBrand({ name: 'Soft Delete Test', active: true });

      const response = await request(app)
        .delete(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deletedBrand = await Brand.findById(brand._id);
      expect(deletedBrand).toBeTruthy(); // Still exists in DB
      expect(deletedBrand?.active).toBe(false); // But marked as inactive
    });

    it('should prevent deletion of brand with active products', async () => {
      const brand = await createTestBrand({ name: 'Brand with Products' });
      await createTestProductParent({ brand: brand._id as mongoose.Types.ObjectId });

      const response = await request(app)
        .delete(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No se puede eliminar una marca con productos activos');

      // Verify brand still active
      const brandCheck = await Brand.findById(brand._id);
      expect(brandCheck?.active).toBe(true);
    });

    it('should return 404 for non-existent brand', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/brands/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid brand ID format', async () => {
      const response = await request(app)
        .delete('/api/brands/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should be excluded from list after soft delete', async () => {
      const brand = await createTestBrand({ name: 'Delete then List' });

      // Delete the brand
      await request(app)
        .delete(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Try to get it by ID
      const response = await request(app).get(`/api/brands/${brand._id}`);

      // Should still return the brand (not filtered by active in get by ID)
      expect(response.status).toBe(200);

      // But should not appear in list
      const listResponse = await request(app).get('/api/brands');
      const ids = listResponse.body.data.brands.map((b: any) => b._id);
      expect(ids).not.toContain(brand._id.toString());
    });
  });

  // ==================== Slug Generation Tests ====================

  describe('Slug Generation', () => {
    it('should generate slug from Spanish text with accents', async () => {
      const brand = await createTestBrand({ name: 'Café Extraordinário' });

      expect(brand.slug).toBeDefined();
      expect(brand.slug).toBe('cafe-extraordinario');
    });

    it('should handle uppercase conversion to lowercase', async () => {
      const brand = await createTestBrand({ name: 'BRAND NAME' });

      expect(brand.slug).toBe('brand-name');
    });

    it('should replace spaces with hyphens', async () => {
      const brand = await createTestBrand({ name: 'Multi Word Brand Name' });

      expect(brand.slug).toBe('multi-word-brand-name');
    });

    it('should remove special characters', async () => {
      const brand = await createTestBrand({ name: 'Brand@#$%Name' });

      expect(brand.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should maintain slug uniqueness', async () => {
      const brand1 = await createTestBrand({ name: 'Same Name' });
      const brand2 = await createTestBrand({ name: 'Same Name 2' });

      expect(brand1.slug).not.toBe(brand2.slug);
    });

    it('should regenerate slug on name update', async () => {
      const brand = await createTestBrand({ name: 'Original Slug' });
      const originalSlug = brand.slug;

      brand.name = 'Updated Slug Name';
      await brand.save();

      expect(brand.slug).not.toBe(originalSlug);
      expect(brand.slug).toBe('updated-slug-name');
    });
  });

  // ==================== Validation Tests ====================

  describe('Input Validation', () => {
    it('should validate required fields on creation', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          logo: 'https://example.com/logo.jpg',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate name minimum length', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A',
        });

      expect(response.status).toBe(400);
    });

    it('should validate name maximum length', async () => {
      const longName = 'A'.repeat(101);

      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
    });

    it('should validate logo URL format', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Valid Name',
          logo: 'not-a-valid-url',
        });

      expect(response.status).toBe(400);
    });

    it('should validate active as boolean', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Valid Name',
          active: 'yes',
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid ID format in params', async () => {
      const response = await request(app).get('/api/brands/not-valid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept valid ObjectId', async () => {
      const brand = await createTestBrand({ name: 'Valid ID Test' });
      const response = await request(app).get(`/api/brands/${brand._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==================== Authorization Tests ====================

  describe('Authorization', () => {
    it('should allow admin to create brands', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Brand', logo: 'https://example.com/logo.jpg' });

      expect(response.status).toBe(201);
    });

    it('should allow funcionario to create brands', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ name: 'Funcionario Brand', logo: 'https://example.com/logo.jpg' });

      expect(response.status).toBe(201);
    });

    it('should deny cliente from creating brands', async () => {
      const response = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ name: 'Cliente Brand', logo: 'https://example.com/logo.jpg' });

      expect(response.status).toBe(403);
    });

    it('should allow admin to update brands', async () => {
      const brand = await createTestBrand({ name: 'Original' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
    });

    it('should allow funcionario to update brands', async () => {
      const brand = await createTestBrand({ name: 'Original' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
    });

    it('should deny cliente from updating brands', async () => {
      const brand = await createTestBrand({ name: 'Original' });

      const response = await request(app)
        .put(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(403);
    });

    it('should allow only admin to delete brands', async () => {
      const brand = await createTestBrand({ name: 'To Delete' });

      const adminResponse = await request(app)
        .delete(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminResponse.status).toBe(200);

      // Create another brand for funcionario test
      const brand2 = await createTestBrand({ name: 'To Delete 2' });

      const funcResponse = await request(app)
        .delete(`/api/brands/${brand2._id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`);

      expect(funcResponse.status).toBe(403);
    });

    it('should deny unauthenticated requests to protected endpoints', async () => {
      const response = await request(app)
        .post('/api/brands')
        .send({ name: 'Unauth Brand' });

      expect(response.status).toBe(401);
    });

    it('should allow public read access to brands', async () => {
      await createTestBrand({ name: 'Public Brand' });

      const listResponse = await request(app).get('/api/brands');
      expect(listResponse.status).toBe(200);

      const brand = await Brand.findOne({ name: 'Public Brand' });
      const getResponse = await request(app).get(`/api/brands/${brand?._id}`);
      expect(getResponse.status).toBe(200);

      const slugResponse = await request(app).get(`/api/brands/slug/${brand?.slug}`);
      expect(slugResponse.status).toBe(200);
    });
  });
});
