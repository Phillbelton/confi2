import request from 'supertest';
import crypto from 'crypto';
import app from '../../server';
import { emailService } from '../../services/emailService';
import { User } from '../../models/User';
import { PasswordResetToken } from '../../models/PasswordResetToken';

/**
 * Flow e2e de password-reset.
 *
 * Punto clave: el token "plano" que el cliente debe enviar al endpoint
 * /reset-password/:token solo existe momentáneamente dentro de
 * AuthService.forgotPassword(), donde se pasa a
 * emailService.sendPasswordResetEmail(email, token, name). Como el
 * setup global mockea ese método con jest.fn(), podemos leer
 * .mock.calls[0][1] para capturarlo. Lo que persiste en DB es el HASH,
 * no el token plano.
 *
 * Reglas que protegen estos tests:
 *  - El token plano nunca se persiste; en DB solo está el sha256(token).
 *  - Cada nuevo forgot invalida (used:true) tokens previos del mismo user.
 *  - Después del reset, el token queda used:true y no puede reutilizarse.
 *  - El token de otro usuario no debe poder modificar la password.
 */

const VALID_PASSWORD = 'Password1!';
const NEW_PASSWORD = 'NewPass2@';

const sendPasswordResetEmailMock = emailService.sendPasswordResetEmail as jest.Mock;

const registerUser = async (
  overrides: Partial<{ name: string; email: string; password: string; phone: string }> = {}
) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const payload = {
    name: 'Cliente Test',
    email: `user-${suffix}@test.com`,
    password: VALID_PASSWORD,
    phone: '+56912345678',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`No se pudo registrar usuario en el setup: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { ...payload, userId: res.body.data.user.id };
};

/**
 * Ejecuta forgot-password contra el endpoint y captura el token plano
 * pasado al mock del emailService (jest.setup.ts lo declara como jest.fn).
 */
const requestResetTokenFor = async (email: string): Promise<string> => {
  sendPasswordResetEmailMock.mockClear();
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email });
  expect(res.status).toBe(200);

  // Captura: (email, token, userName)
  expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1);
  const [, token] = sendPasswordResetEmailMock.mock.calls[0];
  expect(typeof token).toBe('string');
  expect((token as string).length).toBeGreaterThan(0);
  return token as string;
};

describe('password reset flow (e2e)', () => {
  describe('happy path', () => {
    it('forgot → reset con nueva password → login con nueva OK y con vieja KO', async () => {
      const user = await registerUser();

      // 1. forgot — capturar token plano
      const token = await requestResetTokenFor(user.email);

      // 2. reset
      const reset = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
      expect(reset.status).toBe(200);
      expect(reset.body.message).toMatch(/restablecida/i);

      // 3. login con vieja → 401
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: VALID_PASSWORD });
      expect(oldLogin.status).toBe(401);

      // 4. login con nueva → 200
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: NEW_PASSWORD });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.data.token).toBeDefined();
    });

    it('marca el token como used:true después del reset (no se puede reutilizar)', async () => {
      const user = await registerUser();
      const token = await requestResetTokenFor(user.email);

      // Primer reset OK
      const first = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
      expect(first.status).toBe(200);

      // Segundo intento con el mismo token → 400
      const second = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ newPassword: 'OtraNueva3$', confirmPassword: 'OtraNueva3$' });
      expect(second.status).toBe(400);
      expect(second.body.error || second.body.message).toMatch(/inválido|utilizado/i);
    });
  });

  describe('invalidación de tokens viejos', () => {
    it('un segundo forgot invalida el token del primero (used:true)', async () => {
      const user = await registerUser();
      const firstToken = await requestResetTokenFor(user.email);
      const secondToken = await requestResetTokenFor(user.email);

      // El primer token ya no sirve aunque sea sintácticamente válido
      const usedFirst = await request(app)
        .post(`/api/auth/reset-password/${firstToken}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
      expect(usedFirst.status).toBe(400);

      // El segundo sí
      const usedSecond = await request(app)
        .post(`/api/auth/reset-password/${secondToken}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
      expect(usedSecond.status).toBe(200);
    });
  });

  describe('aislamiento entre usuarios', () => {
    it('el token de un usuario NO sirve para resetear a otro', async () => {
      const alice = await registerUser({ email: `alice-${Date.now()}@test.com` });
      const bob = await registerUser({ email: `bob-${Date.now()}@test.com` });

      const aliceToken = await requestResetTokenFor(alice.email);

      // Usamos el token de alice — el endpoint identifica al user dueño del
      // token, no a partir de quién hace la request. Pero el detalle a
      // verificar es que bob NO se ve afectado.
      const res = await request(app)
        .post(`/api/auth/reset-password/${aliceToken}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
      expect(res.status).toBe(200);

      // Bob conserva su password original
      const bobLoginOld = await request(app)
        .post('/api/auth/login')
        .send({ email: bob.email, password: VALID_PASSWORD });
      expect(bobLoginOld.status).toBe(200);

      // Y alice tiene la nueva
      const aliceLoginNew = await request(app)
        .post('/api/auth/login')
        .send({ email: alice.email, password: NEW_PASSWORD });
      expect(aliceLoginNew.status).toBe(200);
    });
  });

  describe('token expirado', () => {
    it('rechaza 400 con un token cuya expiresAt está en el pasado', async () => {
      const user = await registerUser();
      const token = await requestResetTokenFor(user.email);

      // Mover expiresAt al pasado por debajo del modelo (no via API).
      const hashed = crypto.createHash('sha256').update(token).digest('hex');
      await PasswordResetToken.updateOne(
        { token: hashed },
        { expiresAt: new Date(Date.now() - 60 * 1000) }
      );

      const res = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toMatch(/expirad/i);
    });
  });

  describe('validación del nuevo password (Zod)', () => {
    let validToken: string;
    let userEmail: string;

    beforeEach(async () => {
      const user = await registerUser();
      userEmail = user.email;
      validToken = await requestResetTokenFor(user.email);
    });

    it('rechaza si newPassword no cumple la política (sin mayúscula)', async () => {
      const res = await request(app)
        .post(`/api/auth/reset-password/${validToken}`)
        .send({ newPassword: 'weakpass1!', confirmPassword: 'weakpass1!' });
      expect(res.status).toBe(400);
    });

    it('rechaza si newPassword y confirmPassword no coinciden', async () => {
      const res = await request(app)
        .post(`/api/auth/reset-password/${validToken}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: 'Distinto1!' });
      expect(res.status).toBe(400);
      // El refine de Zod marca el camino confirmPassword
      expect(JSON.stringify(res.body)).toMatch(/coincid/i);
    });

    it('no consume el token si la validación de Zod falla', async () => {
      // Intento fallido por Zod
      await request(app)
        .post(`/api/auth/reset-password/${validToken}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: 'Distinto1!' });

      // Reintento con datos válidos: debe funcionar (el token sigue vivo)
      const ok = await request(app)
        .post(`/api/auth/reset-password/${validToken}`)
        .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
      expect(ok.status).toBe(200);

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: userEmail, password: NEW_PASSWORD });
      expect(login.status).toBe(200);
    });
  });

  describe('token inexistente / inválido', () => {
    it('rechaza 400 con un token que no existe en DB', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/totalmente-falso-12345')
        .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
      expect(res.status).toBe(400);
    });
  });

  describe('forgot-password con usuario inactivo', () => {
    it('no genera token para un usuario desactivado (silent — mismo 200 anti-enumeración)', async () => {
      const user = await registerUser();
      await User.updateOne({ email: user.email }, { active: false });

      sendPasswordResetEmailMock.mockClear();
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email });

      expect(res.status).toBe(200); // anti-enumeración
      // El service hace findOne({ email, active: true }) → no llama email
      expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
    });
  });
});
