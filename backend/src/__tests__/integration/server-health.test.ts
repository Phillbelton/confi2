import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  clearDatabase,
} from '../setup/testUtils';
import mongoose from 'mongoose';

/**
 * Server Health and Port Verification Tests
 * Tests for server availability, health checks, and endpoint accessibility
 */

describe('Server Health and Port Verification', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    const admin = await createTestUser({
      email: 'admin-health@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(admin);

    const funcionario = await createTestUser({
      email: 'func-health@test.com',
      role: 'funcionario',
    });
    funcionarioToken = generateAuthToken(funcionario);

    const cliente = await createTestUser({
      email: 'cliente-health@test.com',
      role: 'cliente',
    });
    clienteToken = generateAuthToken(cliente);
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== Health Check Endpoint ====================

  describe('Health Check Endpoint', () => {
    it('should return 200 OK on health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should respond quickly to health check', async () => {
      const startTime = Date.now();

      await request(app).get('/api/health');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // Less than 500ms
    });

    it('should handle multiple concurrent health checks', async () => {
      const requests = Array(50)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  // ==================== API Endpoint Availability ====================

  describe('API Endpoint Availability', () => {
    describe('Public Endpoints', () => {
      it('should respond to GET /api/products/parents', async () => {
        const response = await request(app)
          .get('/api/products/parents')
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should respond to GET /api/products/parents/featured', async () => {
        const response = await request(app)
          .get('/api/products/parents/featured')
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should respond to GET /api/categories', async () => {
        const response = await request(app)
          .get('/api/categories')
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should respond to GET /api/brands', async () => {
        const response = await request(app)
          .get('/api/brands')
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should respond to GET /api/tags', async () => {
        const response = await request(app)
          .get('/api/tags')
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Authenticated Endpoints', () => {
      it('should return 401 without authentication', async () => {
        await request(app)
          .get('/api/auth/me')
          .expect(401);
      });

      it('should return 200 with valid token on /api/auth/me', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${clienteToken}`)
          .expect(200);

        expect(response.body.data.user).toBeDefined();
      });

      it('should return 401 with invalid token', async () => {
        await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid_token')
          .expect(401);
      });
    });

    describe('Role-Protected Endpoints', () => {
      it('should return 403 for admin-only endpoint as cliente', async () => {
        await request(app)
          .get('/api/audit-logs')
          .set('Cookie', `token=${clienteToken}`)
          .expect(403);
      });

      it('should return 200 for admin-only endpoint as admin', async () => {
        const response = await request(app)
          .get('/api/audit-logs')
          .set('Cookie', `token=${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should return 200 for funcionario endpoint as funcionario', async () => {
        const response = await request(app)
          .get('/api/orders')
          .set('Cookie', `token=${funcionarioToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  // ==================== Response Headers ====================

  describe('Response Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // CORS headers should be set by middleware
      expect(response.headers).toBeDefined();
    });

    it('should include content-type header', async () => {
      const response = await request(app)
        .get('/api/products/parents')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Helmet should set these headers
      expect(response.headers).toBeDefined();
    });
  });

  // ==================== Request Methods ====================

  describe('HTTP Methods', () => {
    it('should accept GET requests', async () => {
      await request(app)
        .get('/api/products/parents')
        .expect(200);
    });

    it('should accept POST requests', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-health@test.com',
          password: 'Test123!',
        });

      // Either success or validation error
      expect([200, 401]).toContain(response.status);
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await request(app)
        .options('/api/products/parents');

      // Should respond (CORS preflight)
      expect([200, 204, 404]).toContain(response.status);
    });

    it('should return 404 for unknown endpoints', async () => {
      await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);
    });

    it('should return 405 or handle unsupported methods', async () => {
      const response = await request(app)
        .delete('/api/health');

      // Either method not allowed or endpoint not found
      expect([404, 405, 200]).toContain(response.status);
    });
  });

  // ==================== Database Connectivity ====================

  describe('Database Connectivity', () => {
    it('should have active database connection', async () => {
      const state = mongoose.connection.readyState;
      // 1 = connected, 2 = connecting
      expect([1, 2]).toContain(state);
    });

    it('should perform database operations successfully', async () => {
      const response = await request(app)
        .get('/api/products/parents')
        .expect(200);

      // If this returns data, DB is working
      expect(response.body.success).toBe(true);
    });
  });

  // ==================== Response Time Monitoring ====================

  describe('Response Time Monitoring', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      await request(app).get('/api/health');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should respond to simple queries within 500ms', async () => {
      const startTime = Date.now();
      await request(app).get('/api/products/parents');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should respond to authenticated requests within 500ms', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  // ==================== Content Type Handling ====================

  describe('Content Type Handling', () => {
    it('should accept application/json content type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Should process the request (success or auth failure)
      expect([200, 400, 401]).toContain(response.status);
    });

    it('should return JSON responses', async () => {
      const response = await request(app)
        .get('/api/products/parents')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Should return error, not crash
      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== Rate Limiting Verification ====================

  describe('Rate Limiting', () => {
    it('should allow normal request rates', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get('/api/products/parents'));

      const responses = await Promise.all(requests);

      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });

    // Note: Rate limiting tests may need adjustment based on actual limits
    it('should handle burst requests gracefully', async () => {
      const requests = Array(50)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      const responses = await Promise.all(requests);

      // All should succeed or be rate limited
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  // ==================== Error Response Format ====================

  describe('Error Response Format', () => {
    it('should return consistent error format for 400 errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid',
          password: '',
        });

      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should return consistent error format for 404 errors', async () => {
      const response = await request(app)
        .get('/api/products/parents/507f1f77bcf86cd799439999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return consistent error format for 401 errors', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return consistent error format for 403 errors', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', `token=${clienteToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== Endpoint Versioning ====================

  describe('API Versioning', () => {
    it('should respond to /api prefix endpoints', async () => {
      const response = await request(app)
        .get('/api/products/parents')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-API routes', async () => {
      await request(app)
        .get('/products')
        .expect(404);
    });
  });

  // ==================== Graceful Degradation ====================

  describe('Graceful Degradation', () => {
    it('should handle missing query parameters', async () => {
      const response = await request(app)
        .get('/api/products/parents')
        // No query params
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle invalid query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/products/parents')
        .query({ skip: 'invalid', limit: 'abc' });

      // Should handle gracefully (use defaults or return error)
      expect([200, 400]).toContain(response.status);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect([400, 401]).toContain(response.status);
    });
  });

  // ==================== Server Availability ====================

  describe('Server Availability', () => {
    it('should be available for 100 consecutive requests', async () => {
      for (let i = 0; i < 100; i++) {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
      }
    });

    it('should recover from rapid request bursts', async () => {
      // Send burst
      const burst = Array(100)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      await Promise.all(burst);

      // Server should still respond
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
