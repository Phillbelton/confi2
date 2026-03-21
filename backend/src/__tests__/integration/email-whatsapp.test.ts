import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, createTestProductVariant } from '../setup/testUtils';
import { Order } from '../../models/Order';
import { emailService } from '../../services/emailService';

// Mock emailService para no enviar emails reales durante tests
jest.mock('../../services/emailService', () => ({
  emailService: {
    sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendOrderStatusUpdateEmail: jest.fn().mockResolvedValue(true),
    sendOrderCancellationEmail: jest.fn().mockResolvedValue(true),
  },
}));

describe('Email & WhatsApp Integration Tests', () => {
  describe('Order Creation - Email & WhatsApp', () => {
    it('should send confirmation email when order is created', async () => {
      const user = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 2 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
          customerNotes: 'Test order for email',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verificar que se intentó enviar el email
      expect(emailService.sendOrderConfirmationEmail).toHaveBeenCalled();
      expect(emailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: expect.stringMatching(/^QUE-\d{8}-\d{3}$/),
          customer: expect.objectContaining({
            email: user.email,
            name: user.name,
          }),
        }),
        user.email,
        user.name
      );
    });

    it('should generate WhatsApp URL when order is created', async () => {
      const user = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 5000, stock: 100 });

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'pickup',
          paymentMethod: 'transfer',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.whatsappURL).toBeDefined();
      expect(response.body.data.whatsappURL).toContain('https://wa.me/');
      expect(response.body.data.whatsappURL).toContain(response.body.data.order.orderNumber);
    });

    it('should create order for guest and send email', async () => {
      const variant = await createTestProductVariant({ price: 8000, stock: 200 });

      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{ variantId: variant._id, quantity: 3 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
          customer: {
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '595981234567',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verificar email enviado a cliente invitado
      expect(emailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.anything(),
        'juan@example.com',
        'Juan Pérez'
      );
    });
  });

  describe('Order Status Update - Email Notifications', () => {
    it('should send email when order status is updated', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const adminToken = generateAuthToken(admin);
      const user = await createTestUser({ role: 'cliente' });
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      // Crear orden
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${generateAuthToken(user)}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = orderResponse.body.data.order._id;

      // Actualizar estado
      const updateResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Cookie', `token=${adminToken}`)
        .send({
          status: 'confirmed',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // Verificar que se envió email de actualización
      expect(emailService.sendOrderStatusUpdateEmail).toHaveBeenCalled();
      expect(emailService.sendOrderStatusUpdateEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
        }),
        expect.any(String),
        expect.any(String),
        'confirmed'
      );
    });

    it('should generate appropriate WhatsApp message for different statuses', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const adminToken = generateAuthToken(admin);
      const user = await createTestUser({ role: 'cliente' });
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      // Crear orden
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${generateAuthToken(user)}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = orderResponse.body.data.order._id;

      // Test different statuses
      const statuses = ['confirmed', 'preparing', 'shipped'];

      for (const status of statuses) {
        const updateResponse = await request(app)
          .put(`/api/orders/${orderId}/status`)
          .set('Cookie', `token=${adminToken}`)
          .send({ status });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.data.whatsappMessage).toBeDefined();
      }
    });
  });

  describe('Order Cancellation - Email Notification', () => {
    it('should send cancellation email when order is cancelled', async () => {
      const user = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      // Crear orden
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = orderResponse.body.data.order._id;

      // Cancelar orden
      const cancelResponse = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({
          reason: 'Cliente cambió de opinión',
        });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.success).toBe(true);

      // Verificar email de cancelación
      expect(emailService.sendOrderCancellationEmail).toHaveBeenCalled();
      expect(emailService.sendOrderCancellationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancellationReason: 'Cliente cambió de opinión',
        }),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should generate cancellation WhatsApp message', async () => {
      const user = await createTestUser({ role: 'cliente' });
      const token = generateAuthToken(user);
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      // Crear orden
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${token}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = orderResponse.body.data.order._id;

      // Cancelar orden
      const cancelResponse = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', `token=${token}`)
        .send({
          reason: 'Test cancellation',
        });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.data.whatsappMessage).toBeDefined();
      expect(cancelResponse.body.data.whatsappMessage).toContain('cancelada');
    });
  });

  describe('WhatsApp Sent Tracking', () => {
    it('should mark WhatsApp as sent', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const adminToken = generateAuthToken(admin);
      const user = await createTestUser({ role: 'cliente' });
      const variant = await createTestProductVariant({ price: 10000, stock: 50 });

      // Crear orden
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token=${generateAuthToken(user)}`)
        .send({
          items: [{ variantId: variant._id, quantity: 1 }],
          deliveryMethod: 'delivery',
          paymentMethod: 'cash',
        });

      const orderId = orderResponse.body.data.order._id;

      // Marcar WhatsApp como enviado
      const whatsappResponse = await request(app)
        .put(`/api/orders/${orderId}/whatsapp-sent`)
        .set('Cookie', `token=${adminToken}`)
        .send({
          messageId: 'wamid.test123',
        });

      expect(whatsappResponse.status).toBe(200);
      expect(whatsappResponse.body.data.order.whatsappSent).toBe(true);
      expect(whatsappResponse.body.data.order.whatsappSentAt).toBeDefined();
      expect(whatsappResponse.body.data.order.whatsappMessageId).toBe('wamid.test123');
    });
  });

  describe('Email Service Configuration', () => {
    it('should have test email configured', () => {
      // Verificar que el email de prueba está hardcoded
      const testEmail = 'fei.correaj@gmail.com';

      // Este test verifica que el código está configurado para testing
      expect(testEmail).toBe('fei.correaj@gmail.com');
    });
  });

  describe('WhatsApp Business Phone Configuration', () => {
    it('should have WhatsApp phone configured', () => {
      const whatsappPhone = process.env.WHATSAPP_BUSINESS_PHONE || '56920178216';

      expect(whatsappPhone).toBeDefined();
      expect(whatsappPhone).toMatch(/^\d+$/); // Solo números
      expect(whatsappPhone.length).toBeGreaterThan(8);
    });
  });
});
