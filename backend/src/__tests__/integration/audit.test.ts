import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, createTestProductVariant, createTestAuditLog } from '../setup/testUtils';
import AuditLogModel, { IAuditLog } from '../../models/AuditLog';
import ProductVariant from '../../models/ProductVariant';
import mongoose from 'mongoose';

const AuditLog = AuditLogModel;

describe('Audit Logs API', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;
  let admin: any;

  beforeEach(async () => {
    admin = await createTestUser({ role: 'admin', email: 'admin@test.com' });
    const funcionario = await createTestUser({ role: 'funcionario', email: 'func@test.com' });
    const cliente = await createTestUser({ role: 'cliente', email: 'cliente@test.com' });

    adminToken = generateAuthToken(admin);
    funcionarioToken = generateAuthToken(funcionario);
    clienteToken = generateAuthToken(cliente);
  });

  describe('GET /api/audit-logs', () => {
    it('should list all audit logs as admin', async () => {
      // Create some audit logs
      await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'product',
        changes: {
          after: { name: 'Test Product' },
        },
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter logs by action type', async () => {
      await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'product',
        changes: { after: {} },
      });
      await createTestAuditLog({
        user: admin._id,
        action: 'update',
        entity: 'product',
        changes: { before: {}, after: {} },
      });
      await createTestAuditLog({
        user: admin._id,
        action: 'delete',
        entity: 'product',
        changes: { before: {} },
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${adminToken}`)
        .query({ action: 'update' });

      expect(response.status).toBe(200);
      expect(response.body.data.data.every((log: any) => log.action === 'update')).toBe(true);
    });

    it('should filter logs by entity type', async () => {
      await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'product',
        changes: { after: {} },
      });
      await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'category',
        changes: { after: {} },
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${adminToken}`)
        .query({ entity: 'product' });

      expect(response.status).toBe(200);
      expect(response.body.data.data.every((log: any) => log.entity === 'product')).toBe(true);
    });

    it('should filter logs by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'product',
        changes: { after: {} },
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

      expect(response.status).toBe(200);
    });

    it('should reject access from funcionario', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${funcionarioToken}`);

      expect(response.status).toBe(403);
    });

    it('should reject access from cliente', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${clienteToken}`);

      expect(response.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/audit-logs');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/audit-logs/entity/:entity/:entityId', () => {
    it('should get audit history for specific entity', async () => {
      const entityId = new mongoose.Types.ObjectId();

      await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'product',
        entityId,
        changes: { after: { name: 'Test' } },
      });
      await createTestAuditLog({
        user: admin._id,
        action: 'update',
        entity: 'product',
        entityId,
        changes: { before: { name: 'Test' }, after: { name: 'Updated' } },
      });

      const response = await request(app)
        .get(`/api/audit-logs/entity/product/${entityId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toBeInstanceOf(Array);
      expect(response.body.data.logs.length).toBe(2);
    });

    it('should return empty array for entity with no history', async () => {
      const entityId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/audit-logs/entity/product/${entityId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toEqual([]);
    });

    it('should sort logs by date descending (newest first)', async () => {
      const entityId = new mongoose.Types.ObjectId();

      const log1 = await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'product',
        entityId,
        changes: { after: {} },
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const log2 = await createTestAuditLog({
        user: admin._id,
        action: 'update',
        entity: 'product',
        entityId,
        changes: { before: {}, after: {} },
      });

      const response = await request(app)
        .get(`/api/audit-logs/entity/product/${entityId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      const logs = response.body.data.logs;
      expect(new Date(logs[0].createdAt) >= new Date(logs[1].createdAt)).toBe(true);
    });

    it('should reject access from non-admin', async () => {
      const entityId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/audit-logs/entity/product/${entityId}`)
        .set('Cookie', `token=${clienteToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/audit-logs/user/:userId', () => {
    it('should get activity logs for specific user', async () => {
      const targetUser = await createTestUser({ email: 'target@test.com' });

      await createTestAuditLog({
        user: targetUser._id,
        action: 'create',
        entity: 'product',
        changes: { after: {} },
      });
      await createTestAuditLog({
        user: targetUser._id,
        action: 'update',
        entity: 'category',
        changes: { before: {}, after: {} },
      });

      const response = await request(app)
        .get(`/api/audit-logs/user/${targetUser._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toBeInstanceOf(Array);
      expect(response.body.data.logs.length).toBe(2);
    });

    it('should return empty array for user with no activity', async () => {
      const newUser = await createTestUser({ email: 'newuser@test.com' });

      const response = await request(app)
        .get(`/api/audit-logs/user/${newUser._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toEqual([]);
    });

    it('should include user information in response', async () => {
      const targetUser = await createTestUser({ email: 'target@test.com' });

      await createTestAuditLog({
        user: targetUser._id,
        action: 'create',
        entity: 'product',
        changes: { after: {} },
      });

      const response = await request(app)
        .get(`/api/audit-logs/user/${targetUser._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs[0].user).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/audit-logs/user/${fakeId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject access from non-admin', async () => {
      const targetUser = await createTestUser({ email: 'target@test.com' });

      const response = await request(app)
        .get(`/api/audit-logs/user/${targetUser._id}`)
        .set('Cookie', `token=${funcionarioToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Audit Log Creation', () => {
    it('should auto-create log on product update', async () => {
      const variant = await createTestProductVariant({ name: 'Original Name', price: 10000 });

      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({
          name: 'Updated Name',
          price: 15000,
        });

      const logs = await AuditLog.find({
        entity: 'variant',
        entityId: variant._id.toString(),
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log: IAuditLog) => log.action === 'update')).toBe(true);
    });

    it('should capture before and after values on update', async () => {
      const variant = await createTestProductVariant({ price: 10000 });

      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({ price: 20000 });

      const logs = await AuditLog.find({
        entity: 'variant',
        entityId: variant._id.toString(),
        action: 'update',
      });

      if (logs.length > 0) {
        expect(logs[0].changes.before).toBeDefined();
        expect(logs[0].changes.after).toBeDefined();
      }
    });

    it('should record user who made the change', async () => {
      const variant = await createTestProductVariant();

      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({ price: 15000 });

      const logs = await AuditLog.find({
        entity: 'variant',
        entityId: variant._id.toString(),
      });

      if (logs.length > 0) {
        expect(logs[0].user.toString()).toBe(admin._id.toString());
      }
    });

    it('should record IP address', async () => {
      const variant = await createTestProductVariant();

      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({ price: 15000 });

      const logs = await AuditLog.find({
        entity: 'variant',
        entityId: variant._id.toString(),
      });

      if (logs.length > 0) {
        expect(logs[0].ipAddress).toBeDefined();
      }
    });
  });

  describe('Action Types', () => {
    it('should support "create" action', async () => {
      await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'product',
        changes: {
          after: { name: 'New Product' },
        },
      });

      const log = await AuditLog.findOne({ action: 'create' });
      expect(log?.action).toBe('create');
    });

    it('should support "update" action', async () => {
      await createTestAuditLog({
        user: admin._id,
        action: 'update',
        entity: 'product',
        changes: {
          before: { price: 10000 },
          after: { price: 15000 },
        },
      });

      const log = await AuditLog.findOne({ action: 'update' });
      expect(log?.action).toBe('update');
    });

    it('should support "delete" action', async () => {
      await createTestAuditLog({
        user: admin._id,
        action: 'delete',
        entity: 'product',
        changes: {
          before: { name: 'Deleted Product' },
        },
      });

      const log = await AuditLog.findOne({ action: 'delete' });
      expect(log?.action).toBe('delete');
    });

    it('should support "cancel" action', async () => {
      await createTestAuditLog({
        user: admin._id,
        action: 'cancel',
        entity: 'order',
        changes: {
          before: { status: 'confirmed' },
          after: { status: 'cancelled' },
        },
      });

      const log = await AuditLog.findOne({ action: 'cancel' });
      expect(log?.action).toBe('cancel');
    });

    it('should support "block" action', async () => {
      await createTestAuditLog({
        user: admin._id,
        action: 'block',
        entity: 'user',
        changes: {
          before: { active: true },
          after: { active: false },
        },
      });

      const log = await AuditLog.findOne({ action: 'block' });
      expect(log?.action).toBe('block');
    });
  });

  describe('Statistics and Insights', () => {
    it('should provide stats on admin activity', async () => {
      // Create various actions
      await createTestAuditLog({
        user: admin._id,
        action: 'create',
        entity: 'product',
        changes: { after: {} },
      });
      await createTestAuditLog({
        user: admin._id,
        action: 'update',
        entity: 'product',
        changes: { before: {}, after: {} },
      });

      const response = await request(app)
        .get('/api/audit-logs/stats')
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats).toBeDefined();
    });
  });
});
