import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken } from '../setup/testUtils';
import { User } from '../../models/User';

describe('Users API (Admin Only)', () => {
  let adminToken: string;
  let funcionarioToken: string;
  let clienteToken: string;

  beforeEach(async () => {
    const admin = await createTestUser({ role: 'admin', email: 'admin@test.com' });
    const funcionario = await createTestUser({ role: 'funcionario', email: 'func@test.com' });
    const cliente = await createTestUser({ role: 'cliente', email: 'cliente@test.com' });

    adminToken = generateAuthToken(admin);
    funcionarioToken = generateAuthToken(funcionario);
    clienteToken = generateAuthToken(cliente);
  });

  describe('GET /api/users', () => {
    it('should list all users as admin with pagination', async () => {
      await createTestUser({ email: 'user1@test.com' });
      await createTestUser({ email: 'user2@test.com' });

      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
    });

    it('should filter users by role', async () => {
      await createTestUser({ role: 'funcionario', email: 'func2@test.com' });
      await createTestUser({ role: 'cliente', email: 'cliente2@test.com' });

      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .query({ role: 'funcionario' });

      expect(response.status).toBe(200);
      expect(response.body.data.data.every((u: any) => u.role === 'funcionario')).toBe(true);
    });

    it('should search users by name or email', async () => {
      await createTestUser({ name: 'John Doe', email: 'john@test.com' });
      await createTestUser({ name: 'Jane Smith', email: 'jane@test.com' });

      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .query({ search: 'John' });

      expect(response.status).toBe(200);
      expect(response.body.data.data.some((u: any) => u.name.includes('John'))).toBe(true);
    });

    it('should reject listing users as funcionario', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${funcionarioToken}`);

      expect(response.status).toBe(403);
    });

    it('should reject listing users as cliente', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${clienteToken}`);

      expect(response.status).toBe(403);
    });

    it('should reject listing users without authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/funcionarios', () => {
    it('should list only funcionarios as admin', async () => {
      await createTestUser({ role: 'funcionario', email: 'func2@test.com' });
      await createTestUser({ role: 'funcionario', email: 'func3@test.com' });
      await createTestUser({ role: 'cliente', email: 'cliente2@test.com' });

      const response = await request(app)
        .get('/api/users/funcionarios')
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.every((u: any) => u.role === 'funcionario')).toBe(true);
    });

    it('should reject request as cliente', async () => {
      const response = await request(app)
        .get('/api/users/funcionarios')
        .set('Cookie', `token=${clienteToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID as admin', async () => {
      const user = await createTestUser({ email: 'target@test.com' });

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('target@test.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject request as cliente', async () => {
      const user = await createTestUser({ email: 'target@test.com' });

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .set('Cookie', `token=${clienteToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user as admin', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'NewUser123!',
          role: 'cliente',
          phone: '595981234567',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@test.com');
      expect(response.body.data.user.password).toBeUndefined();

      // Verify user exists in database
      const user = await User.findOne({ email: 'newuser@test.com' });
      expect(user).toBeDefined();
      expect(user?.active).toBe(true);
    });

    it('should create funcionario user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .send({
          name: 'New Funcionario',
          email: 'newfunc@test.com',
          password: 'Func123!',
          role: 'funcionario',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('funcionario');
    });

    it('should reject duplicate email', async () => {
      await createTestUser({ email: 'existing@test.com' });

      const response = await request(app)
        .post('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .send({
          name: 'Duplicate User',
          email: 'existing@test.com',
          password: 'Test123!',
          role: 'cliente',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Test123!',
          role: 'cliente',
        });

      expect(response.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: '123',
          role: 'cliente',
        });

      expect(response.status).toBe(400);
    });

    it('should reject creation as funcionario', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Cookie', `token=${funcionarioToken}`)
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'Test123!',
          role: 'cliente',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user as admin', async () => {
      const user = await createTestUser({ email: 'update@test.com' });

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({
          name: 'Updated Name',
          phone: '595987654321',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user.name).toBe('Updated Name');
      expect(response.body.data.user.phone).toBe('595987654321');
    });

    it('should update user role', async () => {
      const user = await createTestUser({ role: 'cliente', email: 'promote@test.com' });

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({
          role: 'funcionario',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('funcionario');
    });

    it('should reject updating to invalid role', async () => {
      const user = await createTestUser({ email: 'test@test.com' });

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Cookie', `token=${adminToken}`)
        .send({
          role: 'superadmin',
        });

      expect(response.status).toBe(400);
    });

    it('should reject update as cliente', async () => {
      const user = await createTestUser({ email: 'test@test.com' });

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ name: 'Hacked' });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should change user password as admin', async () => {
      const user = await createTestUser({ email: 'changepass@test.com', password: 'OldPass123!' });

      const response = await request(app)
        .put(`/api/users/${user._id}/password`)
        .set('Cookie', `token=${adminToken}`)
        .send({
          newPassword: 'NewPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.message.toLowerCase()).toContain('contraseña');

      // Verify password was changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser?.comparePassword('NewPass123!');
      expect(isMatch).toBe(true);
    });

    it('should reject weak password', async () => {
      const user = await createTestUser({ email: 'test@test.com' });

      const response = await request(app)
        .put(`/api/users/${user._id}/password`)
        .set('Cookie', `token=${adminToken}`)
        .send({
          newPassword: '123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject password change as cliente', async () => {
      const user = await createTestUser({ email: 'test@test.com' });

      const response = await request(app)
        .put(`/api/users/${user._id}/password`)
        .set('Cookie', `token=${clienteToken}`)
        .send({ newPassword: 'Hacked123!' });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id/activate', () => {
    it('should activate inactive user', async () => {
      const user = await createTestUser({ email: 'inactive@test.com', active: false });

      const response = await request(app)
        .put(`/api/users/${user._id}/activate`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.active).toBe(true);
    });

    it('should reject activation as funcionario', async () => {
      const user = await createTestUser({ email: 'test@test.com', active: false });

      const response = await request(app)
        .put(`/api/users/${user._id}/activate`)
        .set('Cookie', `token=${funcionarioToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should deactivate user (soft delete)', async () => {
      const user = await createTestUser({ email: 'delete@test.com' });

      const response = await request(app)
        .delete(`/api/users/${user._id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);

      // Verify user is deactivated, not deleted
      const updatedUser = await User.findById(user._id);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.active).toBe(false);
    });

    it('should reject deletion as funcionario', async () => {
      const user = await createTestUser({ email: 'test@test.com' });

      const response = await request(app)
        .delete(`/api/users/${user._id}`)
        .set('Cookie', `token=${funcionarioToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
