import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import Product from '../../models/Product';
import { Category } from '../../models/Category';
import { Order } from '../../models/Order';
import { User, IUser } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';
import type { UserRole } from '../../types';

/**
 * IDOR a nivel de objeto (autorización horizontal): la matriz por rol ya está
 * cubierta en authorize.test.ts. Acá probamos que un usuario del MISMO rol no
 * pueda acceder a recursos de OTRO usuario adivinando el `_id`.
 *
 * Guard bajo prueba: `canAccessOrder` (orderController) devuelve 404 (no 403)
 * para no filtrar existencia, y las direcciones se consultan siempre por
 * `req.user.id` (aislamiento por diseño).
 */

const PASS = 'Password1!';

const mkUser = async (role: UserRole = 'cliente'): Promise<{ user: IUser; token: string }> => {
  const s = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({ name: `U ${role}`, email: `${role}-${s}@test.com`, password: PASS, role, active: true });
  return { user, token: signTokenFor(user) };
};

const seedProduct = async () => {
  const s = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const cat = await Category.create({ name: `Cat ${s}`, slug: `cat-${s}`, level: 0 });
  const prod = await Product.create({
    name: `Prod ${s}`,
    slug: `prod-${s}`,
    description: 'Producto seed para IDOR.',
    categories: [cat._id],
    unitPrice: 1000,
    saleUnit: { type: 'unidad', quantity: 1 },
    tiers: [],
    active: true,
  });
  return prod._id.toString();
};

/** Crea una orden vía API con el token dado (o guest si token es null). */
const createOrder = async (productId: string, token: string | null) => {
  const req = request(app).post('/api/orders');
  if (token) req.set('Authorization', `Bearer ${token}`);
  const res = await req.send({
    customer: { name: 'Cliente', phone: '+56912345678' },
    items: [{ productId, quantity: 1 }],
    deliveryMethod: 'pickup',
    paymentMethod: 'cash',
  });
  return res.body?.data?.order?._id || res.body?.data?._id;
};

// ────────────────────────────────────────────────────────────────────
// Órdenes: GET /api/orders/:id
// ────────────────────────────────────────────────────────────────────
describe('IDOR en órdenes', () => {
  it('cliente B NO puede leer la orden de cliente A (404, no 403)', async () => {
    const productId = await seedProduct();
    const a = await mkUser('cliente');
    const b = await mkUser('cliente');

    const orderId = await createOrder(productId, a.token);
    expect(orderId).toBeTruthy();

    // El dueño sí la ve
    const owner = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${a.token}`);
    expect(owner.status).toBe(200);

    // Otro cliente NO (404 para no filtrar existencia)
    const other = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${b.token}`);
    expect(other.status).toBe(404);
  });

  it('admin y funcionario SÍ pueden leer cualquier orden', async () => {
    const productId = await seedProduct();
    const a = await mkUser('cliente');
    const admin = await mkUser('admin');
    const func = await mkUser('funcionario');

    const orderId = await createOrder(productId, a.token);

    for (const t of [admin.token, func.token]) {
      const res = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${t}`);
      expect(res.status).toBe(200);
    }
  });

  it('una orden guest (sin dueño) no es legible por un cliente cualquiera', async () => {
    const productId = await seedProduct();
    const guestOrderId = await createOrder(productId, null); // sin token → customer.user undefined
    const b = await mkUser('cliente');

    const res = await request(app).get(`/api/orders/${guestOrderId}`).set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });

  it('cliente B NO puede cancelar la orden de cliente A', async () => {
    const productId = await seedProduct();
    const a = await mkUser('cliente');
    const b = await mkUser('cliente');
    const orderId = await createOrder(productId, a.token);

    const res = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ cancellationReason: 'intento de cancelar orden ajena' });

    expect(res.status).toBe(404);
    // Y la orden sigue viva
    const stillThere = await Order.findById(orderId).lean();
    expect(stillThere?.status).not.toBe('cancelled');
  });
});

// ────────────────────────────────────────────────────────────────────
// Direcciones: aislamiento por usuario
// ────────────────────────────────────────────────────────────────────
describe('IDOR en direcciones', () => {
  const addressBody = { label: 'Casa', street: 'Av Siempreviva', number: '742', city: 'Springfield' };

  const createAddressFor = async (token: string): Promise<string> => {
    const res = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody);
    expect(res.status).toBe(201);
    return res.body.data.address._id;
  };

  it('cliente B NO puede modificar la dirección de cliente A', async () => {
    const a = await mkUser('cliente');
    const b = await mkUser('cliente');
    const addressId = await createAddressFor(a.token);

    const res = await request(app)
      .put(`/api/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ label: 'Hackeada', street: 'Calle Falsa', number: '1', city: 'Nowhere' });

    expect(res.status).not.toBe(200);

    // La dirección de A sigue intacta
    const a2 = await User.findById(a.user._id).lean();
    const addr = a2?.addresses?.find((x: { _id: mongoose.Types.ObjectId }) => x._id.toString() === addressId);
    expect(addr?.label).toBe('Casa');
  });

  it('cliente B NO puede borrar la dirección de cliente A', async () => {
    const a = await mkUser('cliente');
    const b = await mkUser('cliente');
    const addressId = await createAddressFor(a.token);

    const res = await request(app)
      .delete(`/api/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).not.toBe(200);

    const a2 = await User.findById(a.user._id).lean();
    expect(a2?.addresses?.length).toBe(1);
  });
});
