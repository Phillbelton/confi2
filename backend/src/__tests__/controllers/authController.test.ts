import request from 'supertest';
import app from '../../server';
import { User } from '../../models/User';
import { invalidateUserStateCache } from '../../middleware/auth';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';

/**
 * Tests e2e del flujo de autenticación: usan supertest contra la app
 * Express real (con todos los middlewares: helmet, mongo-sanitize, xss,
 * validate Zod). NODE_ENV=test desactiva rate limiters y secure cookies.
 *
 * Cobertura priorizada:
 * - register: happy path, validación de zod, duplicados, normalización
 * - login: happy path, credenciales malas, lockout por intentos
 * - getMe / logout / refresh: flujo de sesión
 * - forgot-password: no revela existencia (anti-enumeración)
 * - check-phone: contrato exists true/false
 */

const VALID_PASSWORD = 'Password1!';

const registerPayload = (overrides: Partial<{
  name: string;
  email: string;
  password: string;
  phone: string;
}> = {}) => ({
  name: 'María Pérez',
  email: `user-${Date.now()}-${Math.floor(Math.random() * 1e9)}@test.com`,
  password: VALID_PASSWORD,
  phone: '+56912345678',
  ...overrides,
});

describe('POST /api/auth/register', () => {
  it('crea un usuario nuevo (201) y devuelve user + token + refreshToken', async () => {
    const payload = registerPayload();
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(payload.email.toLowerCase());
    expect(res.body.data.user.role).toBe('cliente');
    expect(typeof res.body.data.token).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');

    // El JWT debe ser verificable con el secreto del env
    const decoded = jwt.verify(res.body.data.token, ENV.JWT_SECRET) as any;
    expect(decoded.email).toBe(payload.email.toLowerCase());
    expect(decoded.role).toBe('cliente');

    // El usuario quedó persistido y activo
    const inDb = await User.findOne({ email: payload.email.toLowerCase() });
    expect(inDb).not.toBeNull();
    expect(inDb?.active).toBe(true);
  });

  it('normaliza el email a lowercase', async () => {
    const payload = registerPayload({ email: 'MiXeD.CASE@TEST.COM' });
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('mixed.case@test.com');
  });

  it('rechaza email duplicado con 400', async () => {
    const payload = registerPayload();
    await request(app).post('/api/auth/register').send(payload);
    const second = await request(app).post('/api/auth/register').send(payload);

    expect(second.status).toBe(400);
    expect(second.body.error || second.body.message).toMatch(
      /email|registrado/i
    );
  });

  it('rechaza email inválido con 400 (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(registerPayload({ email: 'no-es-un-email' }));
    expect(res.status).toBe(400);
  });

  it('rechaza password débil con 400 (sin mayúscula / sin número / sin especial)', async () => {
    const cases = ['password1!', 'PASSWORD1!', 'Password!!', 'Password1'];
    for (const pwd of cases) {
      const res = await request(app)
        .post('/api/auth/register')
        .send(registerPayload({ password: pwd }));
      expect(res.status).toBe(400);
    }
  });

  it('rechaza name muy corto con 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(registerPayload({ name: 'A' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  let credentials: { email: string; password: string };

  beforeEach(async () => {
    const payload = registerPayload();
    await request(app).post('/api/auth/register').send(payload);
    credentials = { email: payload.email, password: payload.password };
  });

  it('autentica con credenciales válidas y devuelve token', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(credentials.email.toLowerCase());
  });

  it('rechaza con 401 si la password es incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'Otra123!Pass' });
    expect(res.status).toBe(401);
    // No debe revelar si la cuenta existe.
    expect(res.body.error || res.body.message).toMatch(/credenciales/i);
  });

  it('rechaza con 401 si el email no existe (mismo mensaje genérico)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-existe@test.com', password: VALID_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error || res.body.message).toMatch(/credenciales/i);
  });

  it('rechaza con 403 si el usuario fue desactivado', async () => {
    await User.updateOne({ email: credentials.email }, { active: false });
    const res = await request(app).post('/api/auth/login').send(credentials);
    expect(res.status).toBe(403);
  });

  it('bloquea la cuenta tras 5 intentos fallidos (423 en el 6to)', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await request(app)
        .post('/api/auth/login')
        .send({ ...credentials, password: 'BadGuess1!' });
      expect(r.status).toBe(401);
    }
    const sixth = await request(app)
      .post('/api/auth/login')
      .send(credentials);
    expect(sixth.status).toBe(423);
    expect(sixth.body.error || sixth.body.message).toMatch(/bloqueada/i);
  });

  it('un login exitoso resetea loginAttempts', async () => {
    // Fallar 3 veces (debajo del límite)
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ ...credentials, password: 'BadGuess1!' });
    }
    let inDb = await User.findOne({ email: credentials.email });
    expect((inDb as any)?.loginAttempts).toBe(3);

    // Login OK → contador a 0
    const ok = await request(app).post('/api/auth/login').send(credentials);
    expect(ok.status).toBe(200);

    inDb = await User.findOne({ email: credentials.email });
    expect((inDb as any)?.loginAttempts).toBe(0);
  });
});

describe('GET /api/auth/me', () => {
  let token: string;

  beforeEach(async () => {
    const payload = registerPayload();
    const res = await request(app).post('/api/auth/register').send(payload);
    token = res.body.data.token;
  });

  it('responde 200 con el usuario actual cuando hay token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBeDefined();
  });

  it('responde 401 si no se envía token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('responde 403 si el usuario quedó inactivo después de emitir el token', async () => {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    await User.updateOne({ _id: decoded.id }, { active: false });
    invalidateUserStateCache(decoded.id);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/logout', () => {
  it('responde 200 cuando hay sesión y limpia las cookies de auth', async () => {
    const payload = registerPayload();
    const reg = await request(app).post('/api/auth/register').send(payload);
    const token = reg.body.data.token;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const setCookies = res.headers['set-cookie'];
    const cookies = Array.isArray(setCookies)
      ? setCookies
      : setCookies
        ? [setCookies]
        : [];
    expect(cookies.some((c: string) => /token=;/.test(c))).toBe(true);
  });
});

describe('POST /api/auth/refresh', () => {
  it('responde 200 con nuevos tokens si el refresh es válido', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send(registerPayload());
    const { refreshToken } = reg.body.data;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('responde 401 si el refresh token es inválido', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'totalmente-invalido' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password (anti-enumeración)', () => {
  it('responde 200 con email existente sin revelar nada', async () => {
    const payload = registerPayload();
    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: payload.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/si el email existe/i);
  });

  it('responde 200 con email INEXISTENTE — mismo mensaje', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nadie@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/si el email existe/i);
  });
});

describe('POST /api/auth/check-phone', () => {
  it('responde exists:true si el teléfono está registrado', async () => {
    const payload = registerPayload();
    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app)
      .post('/api/auth/check-phone')
      .send({ phone: payload.phone });

    expect(res.status).toBe(200);
    expect(res.body.data.exists).toBe(true);
  });

  it('responde exists:false si el teléfono no está registrado', async () => {
    const res = await request(app)
      .post('/api/auth/check-phone')
      .send({ phone: '+5491100000000' });

    expect(res.status).toBe(200);
    expect(res.body.data.exists).toBe(false);
  });

  it('responde 400 si falta phone en el body', async () => {
    const res = await request(app).post('/api/auth/check-phone').send({});
    expect(res.status).toBe(400);
  });
});
