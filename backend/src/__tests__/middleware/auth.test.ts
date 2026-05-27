import jwt from 'jsonwebtoken';
import {
  authenticate,
  invalidateUserStateCache,
} from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { User, IUser } from '../../models/User';
import { ENV } from '../../config/env';
import type { AuthRequest } from '../../types';
import type { Response, NextFunction } from 'express';

/**
 * Helpers
 */
const makeReq = (token?: string, source: 'cookie' | 'header' | 'both' = 'both'): AuthRequest => {
  const req: any = { cookies: {}, headers: {} };
  if (token && (source === 'cookie' || source === 'both')) {
    req.cookies.token = token;
  }
  if (token && (source === 'header' || source === 'both')) {
    req.headers.authorization = `Bearer ${token}`;
  }
  return req as AuthRequest;
};

const makeRes = (): Response => ({} as any);

import { signTokenFor } from '../setup/authTestHelpers';

const signToken = (
  payload: Record<string, unknown>,
  opts?: jwt.SignOptions
) => jwt.sign(payload, ENV.JWT_SECRET, { algorithm: 'HS256', ...(opts || {}) });

/**
 * Crea un usuario y devuelve { user, token } con un JWT firmado con
 * los datos correctos. El test usa este token contra `authenticate`.
 */
const createUserWithToken = async (
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    role: IUser['role'];
    active: boolean;
  }> = {}
): Promise<{ user: IUser; token: string }> => {
  const user = await User.create({
    name: overrides.name ?? 'Test User',
    email:
      overrides.email ?? `user-${Date.now()}-${Math.random()}@test.com`,
    password: overrides.password ?? 'Password1!',
    role: overrides.role ?? 'cliente',
    active: overrides.active ?? true,
  });

  const token = signTokenFor(user);
  return { user, token };
};

describe('authenticate middleware', () => {
  describe('extracción de token', () => {
    it('rechaza con 401 si no hay token', async () => {
      const req = makeReq();
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/Token no proporcionado/);
    });

    it('acepta token desde cookie', async () => {
      const { token } = await createUserWithToken();
      const req = makeReq(token, 'cookie');
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
    });

    it('acepta token desde header Authorization Bearer', async () => {
      const { token } = await createUserWithToken();
      const req = makeReq(token, 'header');
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
    });
  });

  describe('verificación de JWT', () => {
    it('rechaza con 401 "Token inválido" si el token está malformado', async () => {
      const req = makeReq('this-is-not-a-jwt');
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Token inválido');
    });

    it('rechaza con 401 "Token expirado" si el token está expirado (no "Token inválido")', async () => {
      // Regresión de #4: TokenExpiredError extiende JsonWebTokenError, por
      // lo que el orden de los instanceof importa.
      const { user } = await createUserWithToken();
      const expiredToken = signToken(
        { id: user._id.toString(), email: user.email, role: user.role },
        { expiresIn: '-1s' }
      );
      const req = makeReq(expiredToken);
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Token expirado');
    });

    it('rechaza con 401 si el token está firmado con otro secret', async () => {
      const { user } = await createUserWithToken();
      const forged = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        'otro-secret'
      );
      const req = makeReq(forged);
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err.statusCode).toBe(401);
    });
  });

  describe('rechequeo del usuario en DB (#3)', () => {
    it('rechaza con 401 si el usuario del token ya no existe en DB', async () => {
      const { user, token } = await createUserWithToken();
      const userId = user._id.toString();

      // Borrar el usuario después de emitir el token y purgar el caché
      // para forzar el lookup contra DB.
      await User.findByIdAndDelete(userId);
      invalidateUserStateCache(userId);

      const req = makeReq(token);
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Usuario no encontrado');
    });

    it('rechaza con 403 si el usuario fue desactivado (active=false) aunque el JWT siga vigente', async () => {
      const { user, token } = await createUserWithToken({ active: true });
      const userId = user._id.toString();

      // Simular el caso real: admin desactiva al usuario.
      user.active = false;
      await user.save();
      invalidateUserStateCache(userId);

      const req = makeReq(token);
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Cuenta desactivada');
    });

    it('usa el rol actual de DB, no el del JWT (refleja cambios de rol)', async () => {
      const { user, token } = await createUserWithToken({ role: 'cliente' });
      const userId = user._id.toString();

      // Promover al usuario a admin después de emitir el token.
      user.role = 'admin';
      await user.save();
      invalidateUserStateCache(userId);

      const req = makeReq(token);
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user?.role).toBe('admin');
    });

    it('invalidateUserStateCache fuerza un re-lookup en la próxima request', async () => {
      const { user, token } = await createUserWithToken({ active: true });
      const userId = user._id.toString();

      // 1ª request: poblar caché con active=true
      const req1 = makeReq(token);
      const next1: NextFunction = jest.fn();
      await authenticate(req1, makeRes(), next1);
      expect(next1).toHaveBeenCalledWith();

      // Desactivar al usuario sin invalidar el caché. La próxima request
      // SIN invalidar debe seguir pasando (caché stale, dentro del TTL).
      user.active = false;
      await user.save();

      const req2 = makeReq(token);
      const next2: NextFunction = jest.fn();
      await authenticate(req2, makeRes(), next2);
      expect(next2).toHaveBeenCalledWith();

      // Ahora invalidar — la siguiente request debe ver active=false.
      invalidateUserStateCache(userId);

      const req3 = makeReq(token);
      const next3: NextFunction = jest.fn();
      await authenticate(req3, makeRes(), next3);
      const err = (next3 as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
    });
  });

  describe('happy path', () => {
    it('pobla req.user con id/email/role y llama next() sin error', async () => {
      const { user, token } = await createUserWithToken({
        role: 'funcionario',
        active: true,
      });
      invalidateUserStateCache(user._id.toString());

      const req = makeReq(token);
      const next: NextFunction = jest.fn();

      await authenticate(req, makeRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        id: user._id.toString(),
        email: user.email,
        role: 'funcionario',
      });
    });
  });
});
