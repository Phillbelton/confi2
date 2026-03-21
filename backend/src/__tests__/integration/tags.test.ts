import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, createTestTag, clearDatabase } from '../setup/testUtils';
import { testUsers, testTags } from '../setup/testFixtures';
import { Tag } from '../../models/Tag';

/**
 * Tags API Integration Tests
 * Tests all tag endpoints with comprehensive coverage
 */

describe('Tags API', () => {
  beforeEach(async () => {
    // Clear database before each test
    await clearDatabase();
  });

  afterAll(async () => {
    // Clear database after all tests
    await clearDatabase();
  });

  // ==================== GET /api/tags ====================

  describe('GET /api/tags', () => {
    it('should get all active tags by default', async () => {
      const tag1 = await createTestTag({ name: 'Tag 1', active: true });
      const tag2 = await createTestTag({ name: 'Tag 2', active: true });
      const tag3 = await createTestTag({ name: 'Inactive Tag', active: false });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.tags)).toBe(true);
      expect(response.body.data.tags.length).toBe(2);
      expect(response.body.data.tags[0]._id.toString()).toBe(tag1._id.toString());
      expect(response.body.data.tags[1]._id.toString()).toBe(tag2._id.toString());
    });

    it('should include inactive tags when includeInactive=true', async () => {
      const tag1 = await createTestTag({ name: 'Active Tag', active: true });
      const tag2 = await createTestTag({ name: 'Inactive Tag', active: false });

      const response = await request(app)
        .get('/api/tags?includeInactive=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags.length).toBe(2);
    });

    it('should sort tags by order and name', async () => {
      await createTestTag({ name: 'Zebra', order: 3 });
      await createTestTag({ name: 'Apple', order: 1 });
      await createTestTag({ name: 'Banana', order: 2 });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.data.tags[0].name).toBe('Apple');
      expect(response.body.data.tags[1].name).toBe('Banana');
      expect(response.body.data.tags[2].name).toBe('Zebra');
    });

    it('should return empty array when no tags exist', async () => {
      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.tags)).toBe(true);
      expect(response.body.data.tags.length).toBe(0);
    });

    it('should return tags with all required fields', async () => {
      await createTestTag({
        name: 'Test Tag',
        color: '#FF0000',
      });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      const tag = response.body.data.tags[0];
      expect(tag).toHaveProperty('_id');
      expect(tag).toHaveProperty('name', 'Test Tag');
      expect(tag).toHaveProperty('slug');
      expect(tag).toHaveProperty('color', '#FF0000');
      expect(tag).toHaveProperty('active');
      expect(tag).toHaveProperty('order');
      expect(tag).toHaveProperty('createdAt');
      expect(tag).toHaveProperty('updatedAt');
    });
  });

  // ==================== GET /api/tags/active ====================

  describe('GET /api/tags/active', () => {
    it('should get only active tags', async () => {
      const activeTag1 = await createTestTag({ name: 'Active 1', active: true });
      const activeTag2 = await createTestTag({ name: 'Active 2', active: true });
      const inactiveTag = await createTestTag({ name: 'Inactive', active: false });

      const response = await request(app)
        .get('/api/tags/active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags.length).toBe(2);
      expect(response.body.data.tags.map((t: any) => t._id.toString())).toContain(activeTag1._id.toString());
      expect(response.body.data.tags.map((t: any) => t._id.toString())).toContain(activeTag2._id.toString());
      expect(response.body.data.tags.map((t: any) => t._id.toString())).not.toContain(inactiveTag._id.toString());
    });

    it('should sort active tags by order', async () => {
      await createTestTag({ name: 'Tag C', order: 3, active: true });
      await createTestTag({ name: 'Tag A', order: 1, active: true });
      await createTestTag({ name: 'Tag B', order: 2, active: true });

      const response = await request(app)
        .get('/api/tags/active');

      expect(response.status).toBe(200);
      expect(response.body.data.tags[0].order).toBe(1);
      expect(response.body.data.tags[1].order).toBe(2);
      expect(response.body.data.tags[2].order).toBe(3);
    });

    it('should return empty array when no active tags exist', async () => {
      await createTestTag({ name: 'Inactive', active: false });

      const response = await request(app)
        .get('/api/tags/active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags.length).toBe(0);
    });
  });

  // ==================== GET /api/tags/:id ====================

  describe('GET /api/tags/:id', () => {
    it('should get a tag by valid ID', async () => {
      const tag = await createTestTag({ name: 'Get By ID Tag' });

      const response = await request(app)
        .get(`/api/tags/${tag._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tag._id.toString()).toBe(tag._id.toString());
      expect(response.body.data.tag.name).toBe('Get By ID Tag');
    });

    it('should return 404 for non-existent tag ID', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/tags/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrado');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/tags/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return both active and inactive tags by ID', async () => {
      const inactiveTag = await createTestTag({ name: 'Inactive', active: false });

      const response = await request(app)
        .get(`/api/tags/${inactiveTag._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.tag.active).toBe(false);
    });
  });

  // ==================== GET /api/tags/slug/:slug ====================

  describe('GET /api/tags/slug/:slug', () => {
    it('should get a tag by valid slug', async () => {
      const tag = await createTestTag({ name: 'Test Slug Tag' });

      const response = await request(app)
        .get(`/api/tags/slug/${tag.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tag._id.toString()).toBe(tag._id.toString());
      expect(response.body.data.tag.name).toBe('Test Slug Tag');
      expect(response.body.data.tag.slug).toBe(tag.slug);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/tags/slug/non-existent-slug');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrado');
    });

    it('should only return active tags by slug', async () => {
      const inactiveTag = await createTestTag({ name: 'Inactive Tag', active: false });

      const response = await request(app)
        .get(`/api/tags/slug/${inactiveTag.slug}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle special characters in slug', async () => {
      const tag = await createTestTag({ name: 'Tag With Special! @#$%' });

      const response = await request(app)
        .get(`/api/tags/slug/${tag.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.data.tag.slug).toBe(tag.slug);
    });
  });

  // ==================== POST /api/tags ====================

  describe('POST /api/tags', () => {
    it('should create a tag with admin role', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Tag',
          color: '#FF5733',
          description: 'A test tag',
          order: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('exitosamente');
      expect(response.body.data.tag).toHaveProperty('_id');
      expect(response.body.data.tag.name).toBe('New Tag');
      expect(response.body.data.tag.color).toBe('#FF5733');
      expect(response.body.data.tag.description).toBe('A test tag');
      expect(response.body.data.tag.order).toBe(1);
      expect(response.body.data.tag.active).toBe(true);

      // Verify tag was created in database
      const createdTag = await Tag.findById(response.body.data.tag._id);
      expect(createdTag).toBeTruthy();
      expect(createdTag?.name).toBe('New Tag');
    });

    it('should create a tag with funcionario role', async () => {
      const funcionario = await createTestUser(testUsers.funcionario);
      const token = generateAuthToken(funcionario);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Funcionario Tag',
          color: '#00FF00',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tag.name).toBe('Funcionario Tag');
    });

    it('should reject tag creation with cliente role', async () => {
      const cliente = await createTestUser(testUsers.cliente);
      const token = generateAuthToken(cliente);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Tag',
          color: '#0000FF',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it('should reject tag creation without authentication', async () => {
      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'No Auth Tag',
          color: '#FFFFFF',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should use default color if not provided', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Default Color Tag',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.color).toBe('#10B981');
    });

    it('should validate hex color format', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Bad Color Tag',
          color: 'not-a-hex-color',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it('should reject invalid hex color formats', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const invalidColors = [
        'red',
        '#GGGGGG',
        '#12345',
        '12345',
        '#',
        '##FFFFFF',
      ];

      for (const color of invalidColors) {
        const response = await request(app)
          .post('/api/tags')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: `Tag ${Math.random()}`,
            color,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should accept valid 3-digit hex colors', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Three Digit Hex Tag',
          color: '#ABC',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.color).toBe('#ABC');
    });

    it('should accept valid 6-digit hex colors', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Six Digit Hex Tag',
          color: '#ABCDEF',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.color).toBe('#ABCDEF');
    });

    it('should reject duplicate tag names', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      await createTestTag({ name: 'Duplicate Test' });

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Duplicate Test',
          color: '#123456',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should auto-generate slug from name', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'My New Tag Name',
          color: '#FF00FF',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.slug).toBeTruthy();
      expect(response.body.data.tag.slug.includes('my-new-tag-name')).toBe(true);
    });

    it('should set default order to 0 if not provided', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Default Order Tag',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.order).toBe(0);
    });

    it('should reject request with missing required field (name)', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          color: '#FF0000',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', 'Bearer invalid.token.here')
        .send({
          name: 'Bad Token Tag',
          color: '#FF0000',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== PUT /api/tags/:id ====================

  describe('PUT /api/tags/:id', () => {
    it('should update a tag with admin role', async () => {
      const tag = await createTestTag({ name: 'Original Name', color: '#000000' });
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .put(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          color: '#FFFFFF',
          description: 'Updated description',
          order: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('actualizado');
      expect(response.body.data.tag.name).toBe('Updated Name');
      expect(response.body.data.tag.color).toBe('#FFFFFF');
      expect(response.body.data.tag.description).toBe('Updated description');
      expect(response.body.data.tag.order).toBe(5);

      // Verify update persisted
      const updatedTag = await Tag.findById(tag._id);
      expect(updatedTag?.name).toBe('Updated Name');
    });

    it('should update a tag with funcionario role', async () => {
      const tag = await createTestTag({ name: 'Funcionario Update' });
      const funcionario = await createTestUser(testUsers.funcionario);
      const token = generateAuthToken(funcionario);

      const response = await request(app)
        .put(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated By Funcionario',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tag.name).toBe('Updated By Funcionario');
    });

    it('should reject tag update with cliente role', async () => {
      const tag = await createTestTag({ name: 'No Update Tag' });
      const cliente = await createTestUser(testUsers.cliente);
      const token = generateAuthToken(cliente);

      const response = await request(app)
        .put(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Attempted Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject tag update without authentication', async () => {
      const tag = await createTestTag({ name: 'No Auth Update' });

      const response = await request(app)
        .put(`/api/tags/${tag._id}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should update only provided fields', async () => {
      const tag = await createTestTag({
        name: 'Original Name',
        color: '#FF0000',
        description: 'Original description',
        order: 1,
      });
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .put(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tag.name).toBe('New Name');
      expect(response.body.data.tag.color).toBe('#FF0000');
      expect(response.body.data.tag.description).toBe('Original description');
      expect(response.body.data.tag.order).toBe(1);
    });

    it('should validate color hex format on update', async () => {
      const tag = await createTestTag();
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .put(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          color: 'invalid-color',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent tag', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);
      const nonExistentId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/tags/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Update Ghost Tag',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should toggle active status on update', async () => {
      const tag = await createTestTag({ active: true });
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .put(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          active: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tag.active).toBe(false);

      const updatedTag = await Tag.findById(tag._id);
      expect(updatedTag?.active).toBe(false);
    });

    it('should update order correctly', async () => {
      const tag = await createTestTag({ order: 1 });
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .put(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          order: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tag.order).toBe(10);
    });
  });

  // ==================== DELETE /api/tags/:id ====================

  describe('DELETE /api/tags/:id', () => {
    it('should soft delete a tag with admin role', async () => {
      const tag = await createTestTag({ name: 'Delete Test', active: true });
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .delete(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado');

      // Verify soft delete (active set to false)
      const deletedTag = await Tag.findById(tag._id);
      expect(deletedTag?.active).toBe(false);
      expect(deletedTag).toBeTruthy(); // Document still exists
    });

    it('should reject tag deletion with funcionario role', async () => {
      const tag = await createTestTag({ name: 'No Delete' });
      const funcionario = await createTestUser(testUsers.funcionario);
      const token = generateAuthToken(funcionario);

      const response = await request(app)
        .delete(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Verify tag was not deleted
      const tag_after = await Tag.findById(tag._id);
      expect(tag_after?.active).toBe(true);
    });

    it('should reject tag deletion with cliente role', async () => {
      const tag = await createTestTag({ name: 'No Delete Cliente' });
      const cliente = await createTestUser(testUsers.cliente);
      const token = generateAuthToken(cliente);

      const response = await request(app)
        .delete(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject tag deletion without authentication', async () => {
      const tag = await createTestTag({ name: 'No Auth Delete' });

      const response = await request(app)
        .delete(`/api/tags/${tag._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent tag deletion', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);
      const nonExistentId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/tags/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not hard delete, only set active to false', async () => {
      const tag = await createTestTag({ name: 'Soft Delete Test' });
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      await request(app)
        .delete(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`);

      // Tag should still exist in database
      const deletedTag = await Tag.findById(tag._id);
      expect(deletedTag).toBeTruthy();
      expect(deletedTag?.active).toBe(false);
    });
  });

  // ==================== POST /api/tags/get-or-create ====================

  describe('POST /api/tags/get-or-create', () => {
    it('should create a tag if it does not exist', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Brand New Tag',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tag).toHaveProperty('_id');
      expect(response.body.data.tag.name).toBe('Brand New Tag');

      // Verify tag was created
      const createdTag = await Tag.findOne({ name: 'Brand New Tag' });
      expect(createdTag).toBeTruthy();
    });

    it('should return existing tag if it already exists (case-insensitive)', async () => {
      const existingTag = await createTestTag({ name: 'Existing Tag' });
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'existing tag', // Different case
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tag._id.toString()).toBe(existingTag._id.toString());
    });

    it('should work with funcionario role', async () => {
      const funcionario = await createTestUser(testUsers.funcionario);
      const token = generateAuthToken(funcionario);

      const response = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Funcionario Get Or Create',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tag.name).toBe('Funcionario Get Or Create');
    });

    it('should reject get-or-create with cliente role', async () => {
      const cliente = await createTestUser(testUsers.cliente);
      const token = generateAuthToken(cliente);

      const response = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Get Or Create',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject get-or-create without authentication', async () => {
      const response = await request(app)
        .post('/api/tags/get-or-create')
        .send({
          name: 'No Auth Tag',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with missing name', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle whitespace in tag names', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '  Trimmed Tag  ',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tag.name).toBe('Trimmed Tag');
    });

    it('should return same tag on multiple get-or-create calls', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      // First call
      const response1 = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Consistent Tag',
        });

      expect(response1.status).toBe(200);
      const tagId1 = response1.body.data.tag._id;

      // Second call with same name
      const response2 = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Consistent Tag',
        });

      expect(response2.status).toBe(200);
      expect(response2.body.data.tag._id).toBe(tagId1);

      // Verify only one tag exists
      const tagCount = await Tag.countDocuments({ name: 'Consistent Tag' });
      expect(tagCount).toBe(1);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post('/api/tags/get-or-create')
        .set('Authorization', 'Bearer invalid.token.here')
        .send({
          name: 'Bad Token Tag',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== Color Hex Validation ====================

  describe('Color Hex Validation', () => {
    const admin_setup = async () => {
      const admin = await createTestUser(testUsers.admin);
      return generateAuthToken(admin);
    };

    it('should accept lowercase hex colors', async () => {
      const token = await admin_setup();

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Lowercase Hex Tag',
          color: '#abcdef',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.color).toBe('#abcdef');
    });

    it('should accept uppercase hex colors', async () => {
      const token = await admin_setup();

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Uppercase Hex Tag',
          color: '#ABCDEF',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.color).toBe('#ABCDEF');
    });

    it('should accept mixed case hex colors', async () => {
      const token = await admin_setup();

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Mixed Case Hex Tag',
          color: '#AbCdEf',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.color).toBe('#AbCdEf');
    });

    it('should reject hex colors without hash', async () => {
      const token = await admin_setup();

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'No Hash Tag',
          color: 'ABCDEF',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject colors with invalid hex characters', async () => {
      const token = await admin_setup();

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Hex Tag',
          color: '#GGGGGG',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== Order Sorting ====================

  describe('Order Sorting', () => {
    it('should sort tags by order ascending', async () => {
      const tag1 = await createTestTag({ name: 'Order 5', order: 5 });
      const tag2 = await createTestTag({ name: 'Order 1', order: 1 });
      const tag3 = await createTestTag({ name: 'Order 3', order: 3 });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.data.tags[0].order).toBe(1);
      expect(response.body.data.tags[1].order).toBe(3);
      expect(response.body.data.tags[2].order).toBe(5);
    });

    it('should sort by name when order is the same', async () => {
      const tag1 = await createTestTag({ name: 'Zebra', order: 1 });
      const tag2 = await createTestTag({ name: 'Apple', order: 1 });
      const tag3 = await createTestTag({ name: 'Banana', order: 1 });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.data.tags[0].name).toBe('Apple');
      expect(response.body.data.tags[1].name).toBe('Banana');
      expect(response.body.data.tags[2].name).toBe('Zebra');
    });

    it('should handle negative order values', async () => {
      const tag1 = await createTestTag({ name: 'Negative', order: -5 });
      const tag2 = await createTestTag({ name: 'Positive', order: 5 });
      const tag3 = await createTestTag({ name: 'Zero', order: 0 });

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.data.tags[0].order).toBe(-5);
      expect(response.body.data.tags[1].order).toBe(0);
      expect(response.body.data.tags[2].order).toBe(5);
    });

    it('should preserve order after tag updates', async () => {
      const tag = await createTestTag({ name: 'Original', order: 10 });
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      await request(app)
        .put(`/api/tags/${tag._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
        });

      const response = await request(app)
        .get('/api/tags');

      const updatedTag = response.body.data.tags.find((t: any) => t._id === tag._id.toString());
      expect(updatedTag.order).toBe(10);
    });
  });

  // ==================== Edge Cases and Integration Tests ====================

  describe('Tag API Edge Cases', () => {
    it('should handle tags with minimal data', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Minimal Tag',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.name).toBe('Minimal Tag');
      expect(response.body.data.tag.color).toBe('#10B981');
      expect(response.body.data.tag.active).toBe(true);
    });

    it('should handle tags with maximum length name', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);
      const maxName = 'A'.repeat(30);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: maxName,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.name).toBe(maxName);
    });

    it('should reject tags with name exceeding maximum length', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);
      const tooLongName = 'A'.repeat(31);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: tooLongName,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle tags with maximum length description', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);
      const maxDescription = 'A'.repeat(200);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Long Description Tag',
          description: maxDescription,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tag.description).toBe(maxDescription);
    });

    it('should reject descriptions exceeding maximum length', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);
      const tooLongDescription = 'A'.repeat(201);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Bad Description Tag',
          description: tooLongDescription,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle rapid get-or-create requests', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/tags/get-or-create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Concurrent Test Tag',
          })
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Should all return the same tag ID
      const tagIds = results.map((res) => res.body.data.tag._id);
      const firstId = tagIds[0];
      tagIds.forEach((id) => {
        expect(id).toBe(firstId);
      });

      // Only one tag should exist
      const tagCount = await Tag.countDocuments({ name: 'Concurrent Test Tag' });
      expect(tagCount).toBe(1);
    });

    it('should preserve metadata on operations', async () => {
      const admin = await createTestUser(testUsers.admin);
      const token = generateAuthToken(admin);

      const createResponse = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Metadata Test Tag',
        });

      expect(createResponse.status).toBe(201);
      const tagId = createResponse.body.data.tag._id;

      // Verify tag has timestamps
      const dbTag = await Tag.findById(tagId);
      expect(dbTag?.createdAt).toBeTruthy();
      expect(dbTag?.updatedAt).toBeTruthy();
      expect(dbTag?.slug).toBeTruthy();
    });
  });
});
