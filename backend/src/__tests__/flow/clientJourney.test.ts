import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../server';
import { User, IUser } from '../../models/User';
import Product from '../../models/Product';
import { Category } from '../../models/Category';
import { ENV } from '../../config/env';
import type { UserRole } from '../../types';

/**
 * "Client journey" — verifica que un cliente registrado pueda usar TODAS
 * sus funcionalidades disponibles desde el storefront/cuenta:
 *
 *   1. Perfil — ver, actualizar campos editables (name/phone), cambiar
 *      password.
 *   2. Direcciones — CRUD propio, default exclusivo, aislamiento entre
 *      clientes.
 *   3. Órdenes — crear orden vinculada a su user, listar las propias,
 *      ver detalle de las propias, cancelar las propias.
 *   4. Aislamiento (regresión de IDOR) — un cliente NO puede ver/cancelar
 *      órdenes ajenas con solo conocer el id o el orderNumber.
 *
 * Cubre el contrato del cliente; lo que rompa este archivo rompe la
 * experiencia self-service.
 */

const VALID_PASSWORD = 'Password1!';
const NEW_PASSWORD = 'NewPass2@';

const registerClient = async (
  overrides: Partial<{ name: string; email: string; password: string; phone: string }> = {}
) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const payload = {
    name: 'Cliente Test',
    email: `client-${suffix}@test.com`,
    password: VALID_PASSWORD,
    phone: '+56912345678',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  expect(res.status).toBe(201);
  return { ...payload, token: res.body.data.token as string, id: res.body.data.user.id as string };
};

const createAdminToken = async (): Promise<string> => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const u = await User.create({
    name: 'Admin',
    email: `admin-${suffix}@test.com`,
    password: VALID_PASSWORD,
    role: 'admin',
    active: true,
  });
  return jwt.sign(
    { id: u._id.toString(), email: u.email, role: 'admin' as UserRole },
    ENV.JWT_SECRET
  );
};

const seedProduct = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const cat = await Category.create({
    name: `Cat ${suffix}`,
    slug: `cat-${suffix}`,
    level: 0,
  });
  return Product.create({
    name: `Prod ${suffix}`,
    slug: `prod-${suffix}`,
    description: 'Producto seed para tests del cliente.',
    categories: [cat._id],
    unitPrice: 1000,
    saleUnit: { type: 'unidad', quantity: 1 },
    active: true,
  });
};

const placeOrderAs = async (token: string | null, productId: string) => {
  const req2 = request(app).post('/api/orders');
  const r = token ? req2.set('Authorization', `Bearer ${token}`) : req2;
  return r.send({
    customer: { name: 'Comprador', phone: '+56912345678' },
    items: [{ productId, quantity: 1 }],
    deliveryMethod: 'pickup',
    paymentMethod: 'cash',
  });
};

// ────────────────────────────────────────────────────────────────────
// 1. Perfil del cliente
// ────────────────────────────────────────────────────────────────────
describe('Cliente — perfil', () => {
  it('GET /api/auth/me devuelve los datos del usuario logueado', async () => {
    const client = await registerClient();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${client.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({
      email: client.email,
      role: 'cliente',
      name: 'Cliente Test',
    });
    expect(res.body.data.user.addresses).toBeDefined();
    expect(Array.isArray(res.body.data.user.addresses)).toBe(true);
  });

  it('PUT /api/auth/profile actualiza name y phone (campos editables)', async () => {
    const client = await registerClient();
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ name: 'Cliente Renombrado', phone: '+56987654321' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Cliente Renombrado');
    expect(res.body.data.user.phone).toBe('+56987654321');

    // Verificar persistencia
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${client.token}`);
    expect(me.body.data.user.name).toBe('Cliente Renombrado');
  });

  it('PUT /api/auth/profile NO permite cambiar el email (decisión del backend)', async () => {
    const client = await registerClient();
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ email: 'nuevo-email@test.com' });
    // El service explícitamente comenta "El email NO se puede cambiar"
    // y simplemente no lo aplica. Status sigue siendo 200 pero el email
    // queda igual.
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(client.email);
  });

  it('PUT /api/auth/change-password cambia el password con la actual correcta', async () => {
    const client = await registerClient();
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${client.token}`)
      .send({
        currentPassword: VALID_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      });
    expect(res.status).toBe(200);

    // Login con vieja → 401
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: client.email, password: VALID_PASSWORD });
    expect(oldLogin.status).toBe(401);

    // Login con nueva → 200
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: client.email, password: NEW_PASSWORD });
    expect(newLogin.status).toBe(200);
  });

  it('PUT /api/auth/change-password rechaza con 401 si la actual es incorrecta', async () => {
    const client = await registerClient();
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${client.token}`)
      .send({
        currentPassword: 'EquivocadaTotal1!',
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      });
    expect(res.status).toBe(401);
  });

  it('todos los endpoints de perfil rechazan 401 sin token', async () => {
    const a = await request(app).get('/api/auth/me');
    expect(a.status).toBe(401);

    const b = await request(app).put('/api/auth/profile').send({ name: 'X' });
    expect(b.status).toBe(401);

    const c = await request(app)
      .put('/api/auth/change-password')
      .send({
        currentPassword: VALID_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      });
    expect(c.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────────────
// 2. Direcciones del cliente (smoke del CRUD desde el rol cliente)
// ────────────────────────────────────────────────────────────────────
describe('Cliente — direcciones (smoke del flow)', () => {
  // Nota: el detalle del CRUD ya está en addressController.test.ts. Acá
  // solo confirmamos que el flow completo funciona "como cliente".
  it('puede crear, listar, marcar default y eliminar sus direcciones', async () => {
    const client = await registerClient();
    const headers = { Authorization: `Bearer ${client.token}` };

    const a1 = await request(app)
      .post('/api/users/me/addresses').set(headers)
      .send({ label: 'Casa', street: 'Av A', number: '1', city: 'Stgo' });
    expect(a1.status).toBe(201);
    expect(a1.body.data.address.isDefault).toBe(true);

    const a2 = await request(app)
      .post('/api/users/me/addresses').set(headers)
      .send({ label: 'Trabajo', street: 'Av B', number: '2', city: 'Stgo' });
    expect(a2.status).toBe(201);
    expect(a2.body.data.address.isDefault).toBe(false);

    // Cambiar default a la segunda
    const patch = await request(app)
      .patch(`/api/users/me/addresses/${a2.body.data.address._id}/default`)
      .set(headers);
    expect(patch.status).toBe(200);

    // Eliminar la primera (que ya NO es default)
    const del = await request(app)
      .delete(`/api/users/me/addresses/${a1.body.data.address._id}`)
      .set(headers);
    expect(del.status).toBe(200);

    // Quedó una sola
    const list = await request(app).get('/api/users/me/addresses').set(headers);
    expect(list.body.data.addresses).toHaveLength(1);
    expect(list.body.data.addresses[0].label).toBe('Trabajo');
  });
});

// ────────────────────────────────────────────────────────────────────
// 3. Órdenes del cliente
// ────────────────────────────────────────────────────────────────────
describe('Cliente — órdenes asociadas', () => {
  it('al crear una orden autenticado, queda vinculada a su user', async () => {
    const client = await registerClient();
    const product = await seedProduct();
    const r = await placeOrderAs(client.token, product._id.toString());
    expect(r.status).toBe(201);
    expect(r.body.data.order.customer.user).toBe(client.id);
  });

  it('GET /api/orders/my-orders lista solo las propias', async () => {
    const alice = await registerClient();
    const bob = await registerClient();
    const product = await seedProduct();

    await placeOrderAs(alice.token, product._id.toString());
    await placeOrderAs(alice.token, product._id.toString());
    await placeOrderAs(bob.token, product._id.toString());

    const r = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${alice.token}`);
    expect(r.status).toBe(200);
    expect(r.body.data.orders).toHaveLength(2);
    for (const o of r.body.data.orders) {
      expect(o.customer.user.toString()).toBe(alice.id);
    }
  });

  it('GET /api/orders/:id permite al cliente ver SU propia orden', async () => {
    const client = await registerClient();
    const product = await seedProduct();
    const create = await placeOrderAs(client.token, product._id.toString());
    const id = create.body.data.order._id;

    const r = await request(app)
      .get(`/api/orders/${id}`)
      .set('Authorization', `Bearer ${client.token}`);
    expect(r.status).toBe(200);
    expect(r.body.data.order._id).toBe(id);
  });

  it('GET /api/orders/number/:orderNumber permite al cliente ver SU propia orden por número', async () => {
    const client = await registerClient();
    const product = await seedProduct();
    const create = await placeOrderAs(client.token, product._id.toString());
    const orderNumber = create.body.data.order.orderNumber;

    const r = await request(app)
      .get(`/api/orders/number/${orderNumber}`)
      .set('Authorization', `Bearer ${client.token}`);
    expect(r.status).toBe(200);
    expect(r.body.data.order.orderNumber).toBe(orderNumber);
  });

  it('PUT /api/orders/:id/cancel permite al dueño cancelar SU propia orden', async () => {
    const client = await registerClient();
    const product = await seedProduct();
    const create = await placeOrderAs(client.token, product._id.toString());
    const id = create.body.data.order._id;

    const r = await request(app)
      .put(`/api/orders/${id}/cancel`)
      .set('Authorization', `Bearer ${client.token}`)
      .send({ cancellationReason: 'Cambié de opinión sobre el pedido' });

    expect(r.status).toBe(200);
    expect(r.body.data.order.status).toBe('cancelled');
    expect(r.body.data.order.cancelledBy?.toString()).toBe(client.id);
  });
});

// ────────────────────────────────────────────────────────────────────
// 4. Aislamiento (regresión de IDOR descubierto en esta sesión)
// ────────────────────────────────────────────────────────────────────
describe('Cliente — aislamiento (regresión de IDOR)', () => {
  /**
   * Antes del fix, getOrderById / getOrderByNumber / cancelOrder NO
   * chequeaban ownership: cualquier cliente autenticado podía leer o
   * cancelar la orden de OTRO solo conociendo el id o el orderNumber.
   * Ahora el controller usa `canAccessOrder`: cliente solo accede si
   * `order.customer.user === req.user.id`.
   */

  let alice: Awaited<ReturnType<typeof registerClient>>;
  let bob: Awaited<ReturnType<typeof registerClient>>;
  let bobOrderId: string;
  let bobOrderNumber: string;

  beforeEach(async () => {
    alice = await registerClient();
    bob = await registerClient();
    const product = await seedProduct();
    const create = await placeOrderAs(bob.token, product._id.toString());
    bobOrderId = create.body.data.order._id;
    bobOrderNumber = create.body.data.order.orderNumber;
  });

  it('Alice NO puede ver la orden de Bob por ID (404, no filtra existencia)', async () => {
    const r = await request(app)
      .get(`/api/orders/${bobOrderId}`)
      .set('Authorization', `Bearer ${alice.token}`);
    expect(r.status).toBe(404);
  });

  it('Alice NO puede ver la orden de Bob por orderNumber (404)', async () => {
    const r = await request(app)
      .get(`/api/orders/number/${bobOrderNumber}`)
      .set('Authorization', `Bearer ${alice.token}`);
    expect(r.status).toBe(404);
  });

  it('Alice NO puede cancelar la orden de Bob', async () => {
    const r = await request(app)
      .put(`/api/orders/${bobOrderId}/cancel`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ cancellationReason: 'Intento malicioso de cancelación' });
    expect(r.status).toBe(404);

    // Y la orden de Bob queda intacta
    const bobView = await request(app)
      .get(`/api/orders/${bobOrderId}`)
      .set('Authorization', `Bearer ${bob.token}`);
    expect(bobView.body.data.order.status).toBe('pending_whatsapp');
  });

  it('Un cliente NO puede ver órdenes guest (sin customer.user) por ID', async () => {
    // Crear orden sin auth (guest)
    const product = await seedProduct();
    const guest = await placeOrderAs(null, product._id.toString());
    const guestOrderId = guest.body.data.order._id;

    const r = await request(app)
      .get(`/api/orders/${guestOrderId}`)
      .set('Authorization', `Bearer ${alice.token}`);
    expect(r.status).toBe(404);
  });

  it('Admin SÍ puede ver y cancelar cualquier orden (incluyendo de Bob)', async () => {
    const adminToken = await createAdminToken();

    const view = await request(app)
      .get(`/api/orders/${bobOrderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(view.status).toBe(200);

    const cancel = await request(app)
      .put(`/api/orders/${bobOrderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cancellationReason: 'Cancelado por admin (test)' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.order.status).toBe('cancelled');
  });
});
