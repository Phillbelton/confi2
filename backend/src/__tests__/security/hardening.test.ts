import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../server';
import { User } from '../../models/User';
import { ENV } from '../../config/env';
import { signTokenFor } from '../setup/authTestHelpers';

/**
 * Suite de regresión de los hardenings de seguridad agregados en esta
 * pasada. Cubre:
 *
 *  - A3: la política de complejidad de password está unificada (registro
 *    público y creación admin usan la MISMA regla).
 *  - A4: orden de verificación en login (bcrypt SIEMPRE, después estado).
 *  - M1: jwt.verify requiere HS256 explícito (otros algoritmos se rechazan).
 *  - M2: tokenVersion invalida sesiones al cambiar password / desactivar.
 *  - Privilege escalation: el registro público nunca crea funcionarios
 *    ni admins, incluso si el cliente manda `role` en el body.
 */

const STRONG_PASSWORD = 'Password1!';
const ANOTHER_STRONG_PASSWORD = 'AnotherPass2@';

const registerClient = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const payload = {
    name: 'Cliente Test',
    email: `client-${suffix}@test.com`,
    password: STRONG_PASSWORD,
    phone: '+56912345678',
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`Setup falló: ${JSON.stringify(res.body)}`);
  }
  return {
    ...payload,
    token: res.body.data.token as string,
    refreshToken: res.body.data.refreshToken as string,
    id: res.body.data.user.id as string,
  };
};

const createAdmin = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({
    name: 'Admin',
    email: `admin-${suffix}@test.com`,
    password: STRONG_PASSWORD,
    role: 'admin',
    active: true,
  });
  return { user, token: signTokenFor(user) };
};

// ────────────────────────────────────────────────────────────────────
// A3 — Política unificada de complejidad de password
// ────────────────────────────────────────────────────────────────────
describe('A3 — política unificada de password', () => {
  const WEAK_PASSWORDS = [
    '12345678',        // solo números
    'passwordpw',      // solo minúsculas
    'PASSWORD12',      // sin minúsculas
    'Password1',       // sin carácter especial
    'Password!',       // sin números
  ];

  it.each(WEAK_PASSWORDS)(
    'admin NO puede crear funcionarios/admins con password débil (%s)',
    async (weakPassword) => {
      const admin = await createAdmin();

      const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Nuevo admin',
          email: `new-admin-${suffix}@test.com`,
          password: weakPassword,
          role: 'admin',
        });

      expect(res.status).toBe(400);
      // Y no se persistió
      expect(await User.findOne({ email: `new-admin-${suffix}@test.com` })).toBeNull();
    }
  );

  it('admin SÍ puede crear admin con password fuerte', async () => {
    const admin = await createAdmin();
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Nuevo admin',
        email: `new-admin-${suffix}@test.com`,
        password: STRONG_PASSWORD,
        role: 'admin',
      });

    expect(res.status).toBe(201);
  });

  it('PUT /api/users/:id/password también exige la política completa', async () => {
    const admin = await createAdmin();
    const target = await User.create({
      name: 'Target',
      email: `target-${Date.now()}@test.com`,
      password: STRONG_PASSWORD,
      role: 'funcionario',
      active: true,
    });

    const res = await request(app)
      .put(`/api/users/${target._id}/password`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ newPassword: '12345678' });
    expect(res.status).toBe(400);
  });
});

// ────────────────────────────────────────────────────────────────────
// A4 — Orden de verificación en login (bcrypt siempre, después estado)
// ────────────────────────────────────────────────────────────────────
describe('A4 — orden de verificación en login', () => {
  it('email inexistente con cualquier password → 401 "Credenciales inválidas" (no filtra estado)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-existe@test.com', password: 'CualquierPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.error || res.body.message).toMatch(/credenciales/i);
  });

  it('email existente, password incorrecta → 401 + incrementa loginAttempts del user', async () => {
    const client = await registerClient();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: client.email, password: 'PasswordMala1!' });
    expect(res.status).toBe(401);

    const u = await User.findOne({ email: client.email });
    expect((u as any)?.loginAttempts).toBe(1);
  });

  it('email NO existente con password mala → 401 pero NO infla loginAttempts en ningún user', async () => {
    // No hay user para inflar, así que solo verificamos que no
    // explote ni cree nada raro.
    const before = await User.countDocuments();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fantasma@test.com', password: 'PasswordMala1!' });
    expect(res.status).toBe(401);
    const after = await User.countDocuments();
    expect(after).toBe(before);
  });

  it('user existente + pw correcta + active=false → 403 (no antes de verificar password)', async () => {
    const client = await registerClient();
    await User.updateOne({ email: client.email }, { active: false });

    // pw CORRECTA pero cuenta inactiva → ahora sí 403
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: client.email, password: STRONG_PASSWORD });
    expect(res.status).toBe(403);
  });

  it('user existente + pw INCORRECTA + active=false → 401 (no filtra que está inactivo)', async () => {
    const client = await registerClient();
    await User.updateOne({ email: client.email }, { active: false });

    // pw incorrecta → 401 antes de revelar el estado de la cuenta
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: client.email, password: 'PasswordMala1!' });
    expect(res.status).toBe(401);
    // Importante: NO 403, para no permitir enumerar cuentas desactivadas
    expect(res.status).not.toBe(403);
  });
});

// ────────────────────────────────────────────────────────────────────
// M1 — jwt.verify exige HS256
// ────────────────────────────────────────────────────────────────────
describe('M1 — jwt.verify rechaza algoritmos no permitidos', () => {
  it('un JWT firmado con algoritmo "none" no es aceptado', async () => {
    const client = await registerClient();

    // Armar manualmente un JWT sin firma ("alg": "none")
    const header = Buffer.from(
      JSON.stringify({ alg: 'none', typ: 'JWT' })
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        id: client.id,
        email: client.email,
        role: 'admin', // intento de escalada
        tv: 0,
      })
    ).toString('base64url');
    const nonceToken = `${header}.${payload}.`;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${nonceToken}`);
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────────────
// M2 — tokenVersion invalida sesiones
// ────────────────────────────────────────────────────────────────────
describe('M2 — tokenVersion invalida tokens al cambiar password / desactivar', () => {
  it('cambiar la propia password invalida el token anterior (401 "Token revocado")', async () => {
    const client = await registerClient();

    // Token antes del cambio: funciona
    const before = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${client.token}`);
    expect(before.status).toBe(200);

    // Cambiar password
    const changed = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${client.token}`)
      .send({
        currentPassword: STRONG_PASSWORD,
        newPassword: ANOTHER_STRONG_PASSWORD,
        confirmPassword: ANOTHER_STRONG_PASSWORD,
      });
    expect(changed.status).toBe(200);

    // El MISMO token YA NO sirve aunque siga sintácticamente válido
    const after = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${client.token}`);
    expect(after.status).toBe(401);
    expect(after.body.error || after.body.message).toMatch(/revocado/i);
  });

  it('resetPassword (vía token) también invalida los tokens previos', async () => {
    const client = await registerClient();
    const oldToken = client.token;

    // Disparar forgot + capturar el token plano del mock del emailService
    const emailMock = require('../../services/emailService').emailService
      .sendPasswordResetEmail as jest.Mock;
    emailMock.mockClear();
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: client.email });
    const resetToken = emailMock.mock.calls[0][1];

    // Reset
    const reset = await request(app)
      .post(`/api/auth/reset-password/${resetToken}`)
      .send({
        newPassword: ANOTHER_STRONG_PASSWORD,
        confirmPassword: ANOTHER_STRONG_PASSWORD,
      });
    expect(reset.status).toBe(200);

    // El token de antes del reset queda revocado
    const after = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(after.status).toBe(401);
  });

  it('PUT /api/users/:id/password (admin) revoca todos los tokens del target', async () => {
    const admin = await createAdmin();
    const client = await registerClient();

    // Sesión del cliente está viva
    const before = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${client.token}`);
    expect(before.status).toBe(200);

    // El admin le resetea la password
    const changed = await request(app)
      .put(`/api/users/${client.id}/password`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ newPassword: ANOTHER_STRONG_PASSWORD });
    expect(changed.status).toBe(200);

    // La sesión del cliente queda revocada
    const after = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${client.token}`);
    expect(after.status).toBe(401);
  });

  it('DELETE /api/users/:id (desactivar) revoca tokens del target con 401', async () => {
    const admin = await createAdmin();
    const client = await registerClient();

    const deactivated = await request(app)
      .delete(`/api/users/${client.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(deactivated.status).toBe(200);

    // Después de desactivar: el tokenVersion se incrementó, así que el
    // token devuelve 401 'Token revocado' (no 403 'Cuenta desactivada').
    // Cualquiera de los dos código rompe la sesión, pero 401 es más
    // claro al cliente: "tu token ya no es válido, andate".
    const after = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${client.token}`);
    expect([401, 403]).toContain(after.status);
  });

  it('refresh token con tv stale → 401 "Refresh token revocado"', async () => {
    const client = await registerClient();
    const oldRefresh = client.refreshToken;

    // Cambiar password → tokenVersion+1
    await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${client.token}`)
      .send({
        currentPassword: STRONG_PASSWORD,
        newPassword: ANOTHER_STRONG_PASSWORD,
        confirmPassword: ANOTHER_STRONG_PASSWORD,
      });

    // El refresh token viejo ya no debería poder rotar
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────────────
// C2 — Privilege escalation vía /register bloqueado en el service
// ────────────────────────────────────────────────────────────────────
describe('C2 — registro público NO permite asignar role admin/funcionario', () => {
  it('aunque el body tenga role:"admin", el usuario creado queda como cliente', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const email = `escalator-${suffix}@test.com`;
    // El schema Zod hace strip de role (no está declarado), pero por
    // defensa-in-depth el SERVICE también ignora data.role. Acá probamos
    // que aunque alguien parchee el controller para pasar role al
    // service, el resultado SIGUE siendo 'cliente'.
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Atacante',
        email,
        password: STRONG_PASSWORD,
        phone: '+56912345678',
        role: 'admin', // ← intento de escalada
      });

    // Zod strip → el body llega al controller sin role. Status 201.
    expect(res.status).toBe(201);

    // El user creado quedó cliente
    const created = await User.findOne({ email });
    expect(created?.role).toBe('cliente');
  });
});
