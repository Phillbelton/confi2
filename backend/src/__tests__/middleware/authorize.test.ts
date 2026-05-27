import request from 'supertest';
import type { Response, NextFunction } from 'express';
import app from '../../server';
import { authorize, invalidateUserStateCache } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { User, IUser } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';
import type { AuthRequest, UserRole } from '../../types';

/**
 * Cobertura:
 *  1. Unit test del middleware `authorize` en aislamiento (req/res/next
 *     stubs), sin Express ni DB. Valida la lógica pura.
 *  2. Tests e2e con supertest aplicando la matriz RBAC decidida para el
 *     MVP (memory/project_quelita_rbac.md):
 *       - funcionario = ciclo de pedidos (orderRoutes con
 *         authorize('admin','funcionario'))
 *       - admin = todo el catálogo, usuarios, auditoría, dashboard
 *       - cliente = storefront público + /api/orders/my-orders
 */

const VALID_PASSWORD = 'Password1!';

/**
 * Crea un usuario con el rol indicado y devuelve { user, token } con un
 * JWT válido. El token NO se obtiene de /api/auth/register (que siempre
 * crea cliente), sino firmando directamente con JWT_SECRET.
 */
const createUserAndToken = async (
  role: UserRole
): Promise<{ user: IUser; token: string }> => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({
    name: `User ${role}`,
    email: `${role}-${suffix}@test.com`,
    password: VALID_PASSWORD,
    role,
    active: true,
  });
  const token = signTokenFor(user);
  return { user, token };
};

// ────────────────────────────────────────────────────────────────────
// 1. Unit
// ────────────────────────────────────────────────────────────────────
describe('authorize middleware (unit)', () => {
  const makeReq = (role?: UserRole): AuthRequest => {
    const req: any = {};
    if (role) {
      req.user = { id: 'fake-id', email: 'x@test.com', role };
    }
    return req as AuthRequest;
  };
  const makeRes = (): Response => ({} as Response);

  it('responde 401 si no hay req.user (no autenticado)', () => {
    const next: NextFunction = jest.fn();
    authorize('admin')(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/No autenticado/i);
  });

  it('responde 403 si el rol del usuario NO está en la lista permitida', () => {
    const next: NextFunction = jest.fn();
    authorize('admin')(makeReq('cliente'), makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toMatch(/permisos/i);
  });

  it('llama next() sin error si el rol está en la lista permitida', () => {
    const next: NextFunction = jest.fn();
    authorize('admin')(makeReq('admin'), makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('acepta múltiples roles (admin O funcionario)', () => {
    const middleware = authorize('admin', 'funcionario');
    const nextA: NextFunction = jest.fn();
    const nextF: NextFunction = jest.fn();
    const nextC: NextFunction = jest.fn();

    middleware(makeReq('admin'), makeRes(), nextA);
    middleware(makeReq('funcionario'), makeRes(), nextF);
    middleware(makeReq('cliente'), makeRes(), nextC);

    expect(nextA).toHaveBeenCalledWith();
    expect(nextF).toHaveBeenCalledWith();
    // cliente no está permitido → 403
    const err = (nextC as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it('si se llama sin roles, NINGÚN rol pasa (deny-all por seguridad)', () => {
    const middleware = authorize();
    for (const role of ['admin', 'funcionario', 'cliente'] as UserRole[]) {
      const next: NextFunction = jest.fn();
      middleware(makeReq(role), makeRes(), next);
      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err.statusCode).toBe(403);
    }
  });
});

// ────────────────────────────────────────────────────────────────────
// 2. Matriz RBAC aplicada (e2e con supertest)
// ────────────────────────────────────────────────────────────────────
describe('matriz RBAC aplicada (e2e)', () => {
  let admin: { token: string };
  let funcionario: { token: string };
  let cliente: { token: string };

  beforeEach(async () => {
    [admin, funcionario, cliente] = await Promise.all([
      createUserAndToken('admin').then((r) => ({ token: r.token })),
      createUserAndToken('funcionario').then((r) => ({ token: r.token })),
      createUserAndToken('cliente').then((r) => ({ token: r.token })),
    ]);
  });

  describe('rutas admin-only', () => {
    // GET /api/users requiere authorize('admin') vía router.use() en userRoutes
    it('admin → 200 en GET /api/users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });

    it('funcionario → 403 en GET /api/users (no es admin)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${funcionario.token}`);
      expect(res.status).toBe(403);
    });

    it('cliente → 403 en GET /api/users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${cliente.token}`);
      expect(res.status).toBe(403);
    });

    it('sin auth → 401 en GET /api/users', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    // POST /api/categories requiere authorize('admin') específicamente
    it('admin puede crear categorías, funcionario NO', async () => {
      const adminRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Test cat', slug: 'test-cat', level: 0 });
      // El admin pasa el authorize. Puede caer 400 si falta validación de
      // negocio, pero NO 401/403.
      expect([200, 201, 400]).toContain(adminRes.status);
      expect(adminRes.status).not.toBe(403);

      const funcRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${funcionario.token}`)
        .send({ name: 'Test cat 2', slug: 'test-cat-2', level: 0 });
      expect(funcRes.status).toBe(403);
    });
  });

  describe('rutas admin+funcionario (ciclo de pedidos)', () => {
    it('admin → 200 en GET /api/orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });

    it('funcionario → 200 en GET /api/orders (atiende pedidos)', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${funcionario.token}`);
      expect(res.status).toBe(200);
    });

    it('cliente → 403 en GET /api/orders (no debe ver órdenes ajenas)', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${cliente.token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('rutas cliente-only (mis pedidos)', () => {
    it('cliente → 200 en GET /api/orders/my-orders', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${cliente.token}`);
      expect(res.status).toBe(200);
    });

    it('admin → 403 en GET /api/orders/my-orders (no es endpoint suyo)', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(res.status).toBe(403);
    });

    it('funcionario → 403 en GET /api/orders/my-orders', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${funcionario.token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('protección contra escalada por desactivación', () => {
    it('un admin desactivado NO mantiene su acceso (compuesto con #3)', async () => {
      const { user, token } = await createUserAndToken('admin');

      // Caso normal: pasa
      const ok = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(ok.status).toBe(200);

      // Desactivar y purgar caché
      await User.updateOne({ _id: user._id }, { active: false });
      invalidateUserStateCache(user._id.toString());

      // Ahora authenticate corta antes de llegar a authorize → 403
      const blocked = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(blocked.status).toBe(403);
    });

    it('un cliente promovido a admin GANA acceso después de invalidar caché', async () => {
      const { user, token } = await createUserAndToken('cliente');

      // Antes: cliente no pasa /api/users
      const before = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(before.status).toBe(403);

      // Promover y purgar caché
      await User.updateOne({ _id: user._id }, { role: 'admin' });
      invalidateUserStateCache(user._id.toString());

      // Después: pasa, porque authenticate toma role de DB
      const after = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(after.status).toBe(200);
    });
  });
});
