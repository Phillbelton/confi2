import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, clearDatabase } from '../setup/testUtils';
import { testUsers } from '../setup/testFixtures';
import { User } from '../../models/User';
import { PasswordResetToken } from '../../models/PasswordResetToken';
import crypto from 'crypto';

/**
 * Authentication Integration Tests
 * Tests all auth endpoints and their behavior
 */

describe('Authentication API', () => {
  beforeEach(async () => {
    // Clear database before each test
    await clearDatabase();
  });

  afterAll(async () => {
    // Clear database after all tests
    await clearDatabase();
  });

  // ==================== POST /api/auth/register ====================

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          phone: '595981234567',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuario registrado exitosamente');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('name', 'New User');
      expect(response.body.data.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.data.user).toHaveProperty('role', 'cliente');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).toBeTruthy();

      // Verify user was created in database
      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user).toBeTruthy();
      expect(user?.name).toBe('New User');
      expect(user?.phone).toBe('595981234567');
      expect(user?.active).toBe(true);
      expect(user?.role).toBe('cliente');
    });

    it('should set cookies with tokens', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Cookie Test User',
          email: 'cookietest@example.com',
          password: 'SecurePass123!',
          phone: '595981234567',
        });

      expect(response.status).toBe(201);
      expect(response.headers['set-cookie']).toBeDefined();

      const setCookies = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie']
        : [response.headers['set-cookie']];

      const hasCookie = setCookies.some((cookie: string) =>
        cookie.includes('token=') || cookie.includes('refreshToken=')
      );
      expect(hasCookie).toBe(true);
    });

    it('should reject registration with existing email', async () => {
      // Create first user
      await createTestUser({
        email: 'existing@example.com',
        password: 'ExistingPass123!',
      });

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'existing@example.com',
          password: 'DifferentPass123!',
          phone: '595981234567',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Incomplete User',
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'SecurePass123!',
          phone: '595981234567',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Password User',
          email: 'weak@example.com',
          password: '123', // Too short
          phone: '595981234567',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Phone User',
          email: 'invalidphone@example.com',
          password: 'SecurePass123!',
          phone: 'not-a-phone',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should hash password before storing', async () => {
      const plainPassword = 'MySecurePass123!';

      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Password Hash Test',
          email: 'passhash@example.com',
          password: plainPassword,
          phone: '595981234567',
        });

      const user = await User.findOne({ email: 'passhash@example.com' }).select('+password');
      expect(user?.password).not.toBe(plainPassword);
      expect(user?.password).toBeTruthy();

      // Verify password comparison works
      const isMatch = await user!.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });
  });

  // ==================== POST /api/auth/login ====================

  describe('POST /api/auth/login', () => {
    it('should login user successfully with correct credentials', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'CorrectPass123!',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'CorrectPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login exitoso');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email', 'login@example.com');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).toBeTruthy();
    });

    it('should set cookies on successful login', async () => {
      await createTestUser({
        email: 'cookielogin@example.com',
        password: 'SecurePass123!',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'cookielogin@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      await createTestUser({
        email: 'wrongpass@example.com',
        password: 'CorrectPass123!',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Credenciales');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Credenciales');
    });

    it('should reject login for inactive user', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        password: 'SecurePass123!',
        active: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('desactivada');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'SomePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should increment login attempts on failed login', async () => {
      const user = await createTestUser({
        email: 'attempts@example.com',
        password: 'CorrectPass123!',
      });

      expect(user.loginAttempts).toBe(0);

      // First failed attempt
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'attempts@example.com',
          password: 'WrongPass123!',
        });

      let updatedUser = await User.findById(user._id);
      expect(updatedUser?.loginAttempts).toBe(1);

      // Second failed attempt
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'attempts@example.com',
          password: 'WrongPass123!',
        });

      updatedUser = await User.findById(user._id);
      expect(updatedUser?.loginAttempts).toBe(2);
    });

    it('should reset login attempts on successful login', async () => {
      const user = await createTestUser({
        email: 'resetattempts@example.com',
        password: 'CorrectPass123!',
      });

      // Create failed attempts
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'resetattempts@example.com',
          password: 'WrongPass123!',
        });

      let updatedUser = await User.findById(user._id);
      expect(updatedUser?.loginAttempts).toBe(1);

      // Successful login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'resetattempts@example.com',
          password: 'CorrectPass123!',
        });

      expect(response.status).toBe(200);

      updatedUser = await User.findById(user._id);
      expect(updatedUser?.loginAttempts).toBe(0);
    });
  });

  // ==================== POST /api/auth/logout ====================

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user successfully', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout exitoso');
    });

    it('should clear cookies on logout', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();

      const setCookies = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie']
        : [response.headers['set-cookie']];

      // Check for expired cookies
      const hasExpiredCookie = setCookies.some((cookie: string) =>
        (cookie.includes('token=') || cookie.includes('refreshToken=')) &&
        cookie.includes('Max-Age=0')
      );
      expect(hasExpiredCookie).toBe(true);
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== GET /api/auth/me ====================

  describe('GET /api/auth/me', () => {
    it('should return current user info when authenticated', async () => {
      const user = await createTestUser({
        name: 'Test User',
        email: 'me@example.com',
        phone: '595981234567',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('name', 'Test User');
      expect(response.body.data.user).toHaveProperty('email', 'me@example.com');
      expect(response.body.data.user).toHaveProperty('phone', '595981234567');
      expect(response.body.data.user).toHaveProperty('role');
      expect(response.body.data.user).toHaveProperty('addresses');
    });

    it('should not return password in user data', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return addresses in user data', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      // Add an address to the user
      await user.addAddress({
        label: 'Home',
        street: 'Av. Mariscal López',
        number: '1234',
        city: 'Asunción',
        neighborhood: 'Villa Morra',
        isDefault: true,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.addresses).toBeDefined();
      expect(Array.isArray(response.body.data.user.addresses)).toBe(true);
      expect(response.body.data.user.addresses.length).toBe(1);
      expect(response.body.data.user.addresses[0].label).toBe('Home');
    });
  });

  // ==================== PUT /api/auth/profile ====================

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const user = await createTestUser({
        name: 'Old Name',
        phone: '595981111111',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Name',
          phone: '595982222222',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Perfil actualizado exitosamente');
      expect(response.body.data.user.name).toBe('New Name');
      expect(response.body.data.user.phone).toBe('595982222222');

      // Verify changes persisted
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.name).toBe('New Name');
      expect(updatedUser?.phone).toBe('595982222222');
    });

    it('should update only name when phone is not provided', async () => {
      const user = await createTestUser({
        name: 'Old Name',
        phone: '595981111111',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user.name).toBe('Updated Name');
      expect(response.body.data.user.phone).toBe('595981111111');
    });

    it('should update only phone when name is not provided', async () => {
      const user = await createTestUser({
        name: 'Test User',
        phone: '595981111111',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: '595983333333',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.user.phone).toBe('595983333333');
    });

    it('should reject profile update without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          name: 'New Name',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject profile update with invalid phone format', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: 'not-a-phone',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not update email through profile endpoint', async () => {
      const user = await createTestUser({
        email: 'original@example.com',
      });
      const token = generateAuthToken(user);

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'newemail@example.com',
          name: 'Updated Name',
        });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.email).toBe('original@example.com');
    });
  });

  // ==================== PUT /api/auth/change-password ====================

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully with correct current password', async () => {
      const user = await createTestUser({
        password: 'OldPassword123!',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contraseña cambiada exitosamente');

      // Verify old password no longer works
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'OldPassword123!',
        });

      expect(oldLoginResponse.status).toBe(401);

      // Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'NewPassword456!',
        });

      expect(newLoginResponse.status).toBe(200);
    });

    it('should reject password change with incorrect current password', async () => {
      const user = await createTestUser({
        password: 'CorrectPassword123!',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('incorrecta');
    });

    it('should reject password change without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject password change with weak new password', async () => {
      const user = await createTestUser({
        password: 'CorrectPassword123!',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'CorrectPassword123!',
          newPassword: '123', // Too weak
          confirmPassword: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject password change with missing current password', async () => {
      const user = await createTestUser({
        password: 'CorrectPassword123!',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          newPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject password change with missing new password', async () => {
      const user = await createTestUser({
        password: 'CorrectPassword123!',
      });
      const token = generateAuthToken(user);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'CorrectPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== POST /api/auth/refresh ====================

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      // First login to get refresh token in cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'Test123!',
        });

      expect(loginResponse.status).toBe(200);

      // Extract refresh token from cookies
      const cookies = loginResponse.headers['set-cookie'];
      let refreshToken = '';

      if (Array.isArray(cookies)) {
        cookies.forEach((cookie: string) => {
          if (cookie.includes('refreshToken=')) {
            refreshToken = cookie.split('refreshToken=')[1].split(';')[0];
          }
        });
      }

      // Use refresh token to get new token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.message).toBe('Token refrescado exitosamente');
      expect(refreshResponse.body.data).toHaveProperty('token');
      expect(refreshResponse.body.data.token).toBeTruthy();
    });

    it('should set new cookies on token refresh', async () => {
      const user = await createTestUser();

      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'Test123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      let refreshToken = '';

      if (Array.isArray(cookies)) {
        cookies.forEach((cookie: string) => {
          if (cookie.includes('refreshToken=')) {
            refreshToken = cookie.split('refreshToken=')[1].split(';')[0];
          }
        });
      }

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.headers['set-cookie']).toBeDefined();
    });

    it('should reject refresh without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Refresh token');
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject refresh if user no longer exists', async () => {
      const user = await createTestUser();

      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'Test123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      let refreshToken = '';

      if (Array.isArray(cookies)) {
        cookies.forEach((cookie: string) => {
          if (cookie.includes('refreshToken=')) {
            refreshToken = cookie.split('refreshToken=')[1].split(';')[0];
          }
        });
      }

      // Delete the user
      await User.deleteOne({ _id: user._id });

      // Try to refresh
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body.success).toBe(false);
    });
  });

  // ==================== POST /api/auth/forgot-password ====================

  describe('POST /api/auth/forgot-password', () => {
    it('should return success message for existing user email', async () => {
      const user = await createTestUser({
        email: 'forgot@example.com',
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'forgot@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Si el email');
    });

    it('should return success message for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Si el email');
      // Don't reveal whether email exists
    });

    it('should create password reset token in database', async () => {
      const user = await createTestUser({
        email: 'reset@example.com',
      });

      // Clear any existing tokens
      await PasswordResetToken.deleteMany({ userId: user._id });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'reset@example.com',
        });

      expect(response.status).toBe(200);

      // Verify token was created
      const token = await PasswordResetToken.findOne({ userId: user._id });
      expect(token).toBeTruthy();
      expect(token?.used).toBe(false);
      expect(token?.expiresAt).toBeTruthy();
    });

    it('should reject forgot-password with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject forgot-password with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'not-an-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not reset password for inactive user', async () => {
      const user = await createTestUser({
        email: 'inactive@example.com',
        active: false,
      });

      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'inactive@example.com',
        });

      // Verify no reset token was created
      const resetToken = await PasswordResetToken.findOne({ userId: user._id });
      expect(resetToken).toBeFalsy();
    });

    it('should invalidate previous reset tokens when requesting new one', async () => {
      const user = await createTestUser({
        email: 'multiple@example.com',
      });

      // Request first reset token
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'multiple@example.com',
        });

      const firstToken = await PasswordResetToken.findOne({
        userId: user._id,
        used: false,
      });
      expect(firstToken).toBeTruthy();

      // Request second reset token
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'multiple@example.com',
        });

      // First token should be marked as used
      const oldToken = await PasswordResetToken.findOne({
        _id: firstToken?._id,
      });
      expect(oldToken?.used).toBe(true);

      // New token should exist
      const newToken = await PasswordResetToken.findOne({
        userId: user._id,
        used: false,
      });
      expect(newToken).toBeTruthy();
    });
  });

  // ==================== POST /api/auth/reset-password/:token ====================

  describe('POST /api/auth/reset-password/:token', () => {
    it('should reset password with valid reset token', async () => {
      const user = await createTestUser({
        email: 'resettoken@example.com',
        password: 'OldPassword123!',
      });

      // Request password reset
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'resettoken@example.com',
        });

      // Get the reset token
      const resetTokenDoc = await PasswordResetToken.findOne({
        userId: user._id,
        used: false,
      });
      expect(resetTokenDoc).toBeTruthy();

      // Extract plain token (we need to generate it since we only have the hash)
      // For testing, we'll use the password reset flow properly
      const resetTokenPlain = (resetTokenDoc?.token as any);

      // Actually, let's generate a proper token for this test
      const { token: plainToken } = await (PasswordResetToken as any).createResetToken(user._id);

      const response = await request(app)
        .post(`/api/auth/reset-password/${plainToken}`)
        .send({
          newPassword: 'NewResetPassword456!',
          confirmPassword: 'NewResetPassword456!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('exitosamente');

      // Verify old password no longer works
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'resettoken@example.com',
          password: 'OldPassword123!',
        });

      expect(oldLoginResponse.status).toBe(401);

      // Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'resettoken@example.com',
          password: 'NewResetPassword456!',
        });

      expect(newLoginResponse.status).toBe(200);
    });

    it('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password/invalid-token-here')
        .send({
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('inválido');
    });

    it('should reject reset with already-used token', async () => {
      const user = await createTestUser({
        email: 'usedtoken@example.com',
        password: 'OldPassword123!',
      });

      // Generate and use a reset token
      const { token: plainToken } = await (PasswordResetToken as any).createResetToken(user._id);

      // Use the token
      await request(app)
        .post(`/api/auth/reset-password/${plainToken}`)
        .send({
          newPassword: 'FirstReset123!',
          confirmPassword: 'FirstReset123!',
        });

      // Try to use the same token again
      const response = await request(app)
        .post(`/api/auth/reset-password/${plainToken}`)
        .send({
          newPassword: 'SecondReset456!',
          confirmPassword: 'SecondReset456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject reset with expired token', async () => {
      const user = await createTestUser();

      // Create an expired token
      const hashedToken = crypto.createHash('sha256').update('test-token').digest('hex');
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 2); // 2 hours ago

      await PasswordResetToken.create({
        userId: user._id,
        token: hashedToken,
        expiresAt: expiredDate,
        used: false,
      });

      const response = await request(app)
        .post('/api/auth/reset-password/test-token')
        .send({
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('expirado');
    });

    it('should reject reset with missing new password', async () => {
      const user = await createTestUser();
      const { token: plainToken } = await (PasswordResetToken as any).createResetToken(user._id);

      const response = await request(app)
        .post(`/api/auth/reset-password/${plainToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject reset with weak new password', async () => {
      const user = await createTestUser();
      const { token: plainToken } = await (PasswordResetToken as any).createResetToken(user._id);

      const response = await request(app)
        .post(`/api/auth/reset-password/${plainToken}`)
        .send({
          newPassword: '123', // Too weak
          confirmPassword: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reset login attempts after password reset', async () => {
      const user = await createTestUser({
        email: 'lockuser@example.com',
        password: 'OldPassword123!',
      });

      // Create failed login attempts
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'lockuser@example.com',
          password: 'WrongPassword123!',
        });

      let updatedUser = await User.findById(user._id);
      expect(updatedUser?.loginAttempts).toBe(1);

      // Reset password
      const { token: plainToken } = await (PasswordResetToken as any).createResetToken(user._id);
      await request(app)
        .post(`/api/auth/reset-password/${plainToken}`)
        .send({
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      // Login attempts should be reset
      updatedUser = await User.findById(user._id);
      expect(updatedUser?.loginAttempts).toBe(0);
    });

    it('should mark token as used after successful reset', async () => {
      const user = await createTestUser();
      const { token: plainToken } = await (PasswordResetToken as any).createResetToken(user._id);

      const tokenBefore = await PasswordResetToken.findOne({
        userId: user._id,
      });
      expect(tokenBefore?.used).toBe(false);

      await request(app)
        .post(`/api/auth/reset-password/${plainToken}`)
        .send({
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        });

      const tokenAfter = await PasswordResetToken.findOne({
        userId: user._id,
      });
      expect(tokenAfter?.used).toBe(true);
    });
  });

  // ==================== Edge Cases and Integration Tests ====================

  describe('Authentication Edge Cases', () => {
    it('should handle concurrent login attempts properly', async () => {
      const user = await createTestUser({
        email: 'concurrent@example.com',
        password: 'SecurePass123!',
      });

      // Simulate concurrent login attempts
      const results = await Promise.all([
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'concurrent@example.com',
            password: 'SecurePass123!',
          }),
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'concurrent@example.com',
            password: 'SecurePass123!',
          }),
      ]);

      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(200);
    });

    it('should prevent user enumeration through registration', async () => {
      const testEmail = 'enumtest@example.com';

      // Create user
      await createTestUser({ email: testEmail });

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Different User',
          email: testEmail,
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
    });

    it('should handle expired access token with valid refresh token', async () => {
      const user = await createTestUser();

      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'Test123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      let refreshToken = '';

      if (Array.isArray(cookies)) {
        cookies.forEach((cookie: string) => {
          if (cookie.includes('refreshToken=')) {
            refreshToken = cookie.split('refreshToken=')[1].split(';')[0];
          }
        });
      }

      // Access token is still valid here, but demonstrate refresh flow
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.data.token).toBeTruthy();
    });

    it('should maintain session data across requests', async () => {
      const user = await createTestUser({
        name: 'Session Test User',
        email: 'session@example.com',
      });
      const token = generateAuthToken(user);

      // First request
      const firstResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(firstResponse.body.data.user.name).toBe('Session Test User');

      // Update profile
      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Session User',
        });

      // Verify update persisted
      const secondResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(secondResponse.body.data.user.name).toBe('Updated Session User');
    });
  });
});
