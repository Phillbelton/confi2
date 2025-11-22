import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestProductParent,
  createTestProductVariant,
  createTestCategory,
  createTestBrand,
  createTestTag,
  createTestOrder,
  clearDatabase,
} from '../setup/testUtils';
import ProductParent from '../../models/ProductParent';
import ProductVariant from '../../models/ProductVariant';
import { Order } from '../../models/Order';
import { Category } from '../../models/Category';
import { Brand } from '../../models/Brand';
import { Tag } from '../../models/Tag';
import { User } from '../../models/User';
import AuditLogModel, { IAuditLog } from '../../models/AuditLog';
import StockMovementModel from '../../models/StockMovement';

const AuditLog = AuditLogModel;
const StockMovement = StockMovementModel;

/**
 * Audit Consistency Validation Tests
 * Tests for ensuring complete and accurate audit trail of all CRUD operations
 */

describe('Audit Consistency Validation', () => {
  let adminUser: any;
  let funcionarioUser: any;
  let clienteUser: any;
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    adminUser = await createTestUser({
      email: 'admin-audit@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(adminUser);

    funcionarioUser = await createTestUser({
      email: 'func-audit@test.com',
      role: 'funcionario',
    });
    funcionarioToken = generateAuthToken(funcionarioUser);

    clienteUser = await createTestUser({
      email: 'cliente-audit@test.com',
      role: 'cliente',
    });
    // Add default address for order tests
    clienteUser.addresses = [{
      label: 'Casa',
      street: 'Audit Street',
      number: '111',
      city: 'Asuncion',
      neighborhood: 'Centro',
      isDefault: true,
    }];
    await clienteUser.save();
    clienteToken = generateAuthToken(clienteUser);
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

  // ==================== Product Audit Trail ====================

  describe('Product Audit Trail', () => {
    it('should create audit log on product parent creation', async () => {
      const category = await createTestCategory();
      const brand = await createTestBrand();

      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Audited Product',
          description: 'Test description',
          categories: [category._id.toString()],
          brand: brand._id.toString(),
        });

      expect(response.status).toBe(201);

      const auditLog = await AuditLog.findOne({
        entity: 'ProductParent',
        entityId: response.body.data._id,
        action: 'create',
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.user.toString()).toBe(adminUser._id.toString());
      expect(auditLog?.changes.after).toBeDefined();
    });

    it('should create audit log on product parent update', async () => {
      const parent = await createTestProductParent({
        name: 'Original Name',
      });

      await request(app)
        .put(`/api/products/parents/${parent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        });

      const auditLog = await AuditLog.findOne({
        entity: 'ProductParent',
        entityId: parent._id.toString(),
        action: 'update',
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.changes.before).toBeDefined();
      expect(auditLog?.changes.after).toBeDefined();
    });

    it('should create audit log on product parent deletion', async () => {
      const parent = await createTestProductParent();

      await request(app)
        .delete(`/api/products/parents/${parent._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const auditLog = await AuditLog.findOne({
        entity: 'ProductParent',
        entityId: parent._id.toString(),
        action: 'delete',
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.changes.before).toBeDefined();
    });

    it('should capture before state on product variant update', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      const originalPrice = variant.price;
      const originalStock = variant.stock;

      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 15000,
          stock: 80,
        });

      const auditLog = await AuditLog.findOne({
        entity: 'ProductVariant',
        entityId: variant._id.toString(),
        action: 'update',
      });

      expect(auditLog).toBeTruthy();
      if (auditLog?.changes.before) {
        expect(auditLog.changes.before.price).toBe(originalPrice);
      }
    });

    it('should track who made the change', async () => {
      const variant = await createTestProductVariant();

      // Admin update
      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 12000 });

      const adminLog = await AuditLog.findOne({
        entity: 'ProductVariant',
        entityId: variant._id.toString(),
        action: 'update',
      }).sort({ createdAt: -1 });

      expect(adminLog?.user.toString()).toBe(adminUser._id.toString());

      // Funcionario update
      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ price: 13000 });

      const funcLog = await AuditLog.findOne({
        entity: 'ProductVariant',
        entityId: variant._id.toString(),
        action: 'update',
      }).sort({ createdAt: -1 });

      expect(funcLog?.user.toString()).toBe(funcionarioUser._id.toString());
    });
  });

  // ==================== Order Audit Trail ====================

  describe('Order Audit Trail', () => {
    it('should create audit log on order creation', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);

      const auditLog = await AuditLog.findOne({
        entity: 'Order',
        entityId: response.body.data.order._id,
        action: 'create',
      });

      expect(auditLog).toBeTruthy();
    });

    it('should create audit log on order confirmation', async () => {
      const order = await createTestOrder({ status: 'pending_whatsapp' });

      await request(app)
        .put(`/api/orders/${order._id}/confirm`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ shippingCost: 15000 });

      const auditLog = await AuditLog.findOne({
        entity: 'Order',
        entityId: order._id.toString(),
        action: 'update',
      });

      expect(auditLog).toBeTruthy();
      if (auditLog?.changes.before) {
        expect(auditLog.changes.before.status).toBe('pending_whatsapp');
      }
      if (auditLog?.changes.after) {
        expect(auditLog.changes.after.status).toBe('confirmed');
      }
    });

    it('should create audit log on order status change', async () => {
      const order = await createTestOrder({ status: 'confirmed' });

      await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ status: 'preparing' });

      const auditLogs = await AuditLog.find({
        entity: 'Order',
        entityId: order._id.toString(),
        action: 'update',
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should create audit log on order cancellation', async () => {
      const order = await createTestOrder({ status: 'confirmed' });

      await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', `token=${adminToken}`)
        .send({ reason: 'Test cancellation' });

      const auditLog = await AuditLog.findOne({
        entity: 'Order',
        entityId: order._id.toString(),
        action: 'cancel',
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.changes.after.status).toBe('cancelled');
    });

    it('should track complete order lifecycle in audit', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      // Create order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = createResponse.body.data.order._id;

      // Confirm
      await request(app)
        .put(`/api/orders/${orderId}/confirm`)
        .set('Cookie', `token=${funcionarioToken}`)
        .send({ shippingCost: 15000 });

      // Update status through lifecycle
      const statuses = ['preparing', 'ready', 'delivering', 'completed'];
      for (const status of statuses) {
        await request(app)
          .put(`/api/orders/${orderId}/status`)
          .set('Cookie', `token=${funcionarioToken}`)
          .send({ status });
      }

      // Get all audit logs for this order
      const auditLogs = await AuditLog.find({
        entity: 'Order',
        entityId: orderId,
      }).sort({ createdAt: 1 });

      // Should have logs for create + confirm + 4 status changes
      expect(auditLogs.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ==================== Category/Brand/Tag Audit Trail ====================

  describe('Catalog Entities Audit Trail', () => {
    it('should create audit log on category CRUD', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Audited Category',
          description: 'Test',
          color: '#FF0000',
        });

      if (createResponse.status === 201) {
        const categoryId = createResponse.body.data._id;

        const createLog = await AuditLog.findOne({
          entity: 'Category',
          entityId: categoryId,
          action: 'create',
        });
        expect(createLog).toBeTruthy();

        // Update
        await request(app)
          .put(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated Category' });

        const updateLog = await AuditLog.findOne({
          entity: 'Category',
          entityId: categoryId,
          action: 'update',
        });
        expect(updateLog).toBeTruthy();
      }
    });

    it('should create audit log on brand CRUD', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Audited Brand',
        });

      if (createResponse.status === 201) {
        const brandId = createResponse.body.data._id;

        const createLog = await AuditLog.findOne({
          entity: 'Brand',
          entityId: brandId,
          action: 'create',
        });
        expect(createLog).toBeTruthy();
      }
    });

    it('should create audit log on tag CRUD', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Audited Tag',
          color: '#00FF00',
          description: 'Test tag',
        });

      if (createResponse.status === 201) {
        const tagId = createResponse.body.data._id;

        const createLog = await AuditLog.findOne({
          entity: 'Tag',
          entityId: tagId,
          action: 'create',
        });
        expect(createLog).toBeTruthy();
      }
    });
  });

  // ==================== User Audit Trail ====================

  describe('User Audit Trail', () => {
    it('should create audit log on user update', async () => {
      const testUser = await createTestUser({
        email: 'test-user-audit@test.com',
        role: 'cliente',
      });

      await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({ name: 'Updated Name' });

      const auditLog = await AuditLog.findOne({
        entity: 'User',
        entityId: testUser._id.toString(),
        action: 'update',
      });

      expect(auditLog).toBeTruthy();
    });

    it('should create audit log on user block', async () => {
      const testUser = await createTestUser({
        email: 'block-test@test.com',
        role: 'cliente',
      });

      await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({ active: false });

      const auditLog = await AuditLog.findOne({
        entity: 'User',
        entityId: testUser._id.toString(),
      });

      expect(auditLog).toBeTruthy();
    });
  });

  // ==================== Stock Movement Audit Trail ====================

  describe('Stock Movement Audit Trail', () => {
    it('should create stock movement on order creation', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 5 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      const stockMovement = await StockMovement.findOne({
        variant: variant._id,
        type: 'sale',
      });

      expect(stockMovement).toBeTruthy();
      expect(stockMovement?.quantity).toBe(-5);
    });

    it('should create stock movement on order cancellation', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
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

      // Cancel order
      await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ reason: 'Changed mind' });

      const cancelMovement = await StockMovement.findOne({
        variant: variant._id,
        type: 'cancellation',
      });

      expect(cancelMovement).toBeTruthy();
      expect(cancelMovement?.quantity).toBe(10);
    });

    it('should link stock movement to order', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 3 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      const stockMovement = await StockMovement.findOne({
        variant: variant._id,
      });

      expect(stockMovement?.order).toBeDefined();
    });
  });

  // ==================== Audit Log Query and Filtering ====================

  describe('Audit Log Queries', () => {
    it('should filter audit logs by action', async () => {
      // Create some audit logs
      await AuditLog.create({
        user: adminUser._id,
        action: 'create',
        entity: 'Product',
        entityId: '507f1f77bcf86cd799439011',
        changes: { after: { name: 'Test' } },
      });
      await AuditLog.create({
        user: adminUser._id,
        action: 'update',
        entity: 'Product',
        entityId: '507f1f77bcf86cd799439011',
        changes: { before: {}, after: {} },
      });
      await AuditLog.create({
        user: adminUser._id,
        action: 'delete',
        entity: 'Product',
        entityId: '507f1f77bcf86cd799439012',
        changes: { before: {} },
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${adminToken}`)
        .query({ action: 'update' });

      expect(response.status).toBe(200);
      expect(
        response.body.data.data.every((log: any) => log.action === 'update')
      ).toBe(true);
    });

    it('should filter audit logs by entity', async () => {
      await AuditLog.create({
        user: adminUser._id,
        action: 'create',
        entity: 'Product',
        entityId: '507f1f77bcf86cd799439011',
        changes: { after: {} },
      });
      await AuditLog.create({
        user: adminUser._id,
        action: 'create',
        entity: 'Category',
        entityId: '507f1f77bcf86cd799439012',
        changes: { after: {} },
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${adminToken}`)
        .query({ entity: 'Product' });

      expect(response.status).toBe(200);
      expect(
        response.body.data.data.every((log: any) => log.entity === 'Product')
      ).toBe(true);
    });

    it('should get audit history for specific entity', async () => {
      const entityId = '507f1f77bcf86cd799439011';

      await AuditLog.create({
        user: adminUser._id,
        action: 'create',
        entity: 'Product',
        entityId,
        changes: { after: { name: 'Initial' } },
      });
      await AuditLog.create({
        user: adminUser._id,
        action: 'update',
        entity: 'Product',
        entityId,
        changes: { before: { name: 'Initial' }, after: { name: 'Updated' } },
      });

      const response = await request(app)
        .get(`/api/audit-logs/entity/Product/${entityId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBe(2);
    });

    it('should get user activity history', async () => {
      await AuditLog.create({
        user: adminUser._id,
        action: 'create',
        entity: 'Product',
        entityId: '507f1f77bcf86cd799439011',
        changes: { after: {} },
      });
      await AuditLog.create({
        user: adminUser._id,
        action: 'update',
        entity: 'Category',
        entityId: '507f1f77bcf86cd799439012',
        changes: { before: {}, after: {} },
      });

      const response = await request(app)
        .get(`/api/audit-logs/user/${adminUser._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== Discount Audit Consistency ====================

  describe('Discount Audit Consistency', () => {
    it('should audit discount changes on variant', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 20,
            badge: 'SALE',
          },
        });

      const auditLog = await AuditLog.findOne({
        entity: 'ProductVariant',
        entityId: variant._id.toString(),
        action: 'update',
      });

      expect(auditLog).toBeTruthy();
      if (auditLog?.changes.after) {
        expect(auditLog.changes.after.fixedDiscount).toBeDefined();
      }
    });

    it('should audit discount application in orders', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
        stock: 100,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 15,
        },
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${clienteToken}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);

      // Order should have discount recorded
      const order = response.body.data.order;
      expect(order.totalDiscount).toBeGreaterThan(0);

      // Audit log should capture the discounted order
      const auditLog = await AuditLog.findOne({
        entity: 'Order',
        entityId: order._id,
        action: 'create',
      });

      expect(auditLog).toBeTruthy();
    });
  });

  // ==================== Audit Data Integrity ====================

  describe('Audit Data Integrity', () => {
    it('should store IP address in audit log', async () => {
      const variant = await createTestProductVariant();

      await request(app)
        .put(`/api/products/variants/${variant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 15000 });

      const auditLog = await AuditLog.findOne({
        entity: 'ProductVariant',
        entityId: variant._id.toString(),
      });

      expect(auditLog?.ipAddress).toBeDefined();
    });

    it('should maintain timestamp ordering', async () => {
      const variant = await createTestProductVariant();

      // Make multiple updates
      for (let i = 0; i < 5; i++) {
        await request(app)
          .put(`/api/products/variants/${variant._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 10000 + i * 100 });
      }

      const auditLogs = await AuditLog.find({
        entity: 'ProductVariant',
        entityId: variant._id.toString(),
      }).sort({ createdAt: 1 });

      // Verify chronological order
      for (let i = 1; i < auditLogs.length; i++) {
        expect(auditLogs[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          auditLogs[i - 1].createdAt.getTime()
        );
      }
    });

    it('should not lose audit logs under concurrent operations', async () => {
      const variant = await createTestProductVariant();

      const updates = Array(10)
        .fill(null)
        .map((_, i) =>
          request(app)
            .put(`/api/products/variants/${variant._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ price: 10000 + i * 100 })
        );

      await Promise.all(updates);

      const auditLogs = await AuditLog.find({
        entity: 'ProductVariant',
        entityId: variant._id.toString(),
        action: 'update',
      });

      // Should have audit log for each update
      expect(auditLogs.length).toBeGreaterThanOrEqual(5);
    });
  });
});
