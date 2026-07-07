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
 * Mass-assignment / over-posting: que campos sensibles no se puedan setear
 * mandándolos "de más" en el body.
 *
 *  - Perfil: un cliente no puede auto-promoverse a admin vía PUT /auth/profile.
 *  - Órdenes: el precio/total lo recalcula el servidor desde el Product en DB;
 *    los montos que mande el cliente se ignoran (anti price-tampering).
 */

const PASS = 'Password1!';

const mkUser = async (role: UserRole = 'cliente'): Promise<{ user: IUser; token: string }> => {
  const s = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({ name: `U ${role}`, email: `${role}-${s}@test.com`, password: PASS, role, active: true });
  return { user, token: signTokenFor(user) };
};

// ────────────────────────────────────────────────────────────────────
// Escalada de privilegios vía perfil
// ────────────────────────────────────────────────────────────────────
describe('Mass-assignment en perfil', () => {
  it('PUT /api/auth/profile con role:"admin" NO cambia el rol', async () => {
    const { user, token } = await mkUser('cliente');

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nuevo Nombre', role: 'admin', active: true });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('cliente');

    const fresh = await User.findById(user._id).lean();
    expect(fresh?.role).toBe('cliente');
    expect(fresh?.active).toBe(true);
    expect(fresh?.name).toBe('Nuevo Nombre'); // el campo legítimo sí se aplicó
  });

  it('no se puede cambiar el email por over-posting en el perfil', async () => {
    const { user, token } = await mkUser('cliente');
    const originalEmail = user.email;

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', email: 'hijacked@evil.com' });

    // Invariante de seguridad: pase lo que pase (200 con email ignorado, o
    // 400 rechazando el campo), el email NUNCA debe cambiar desde el perfil.
    expect(res.status).not.toBe(500);
    const fresh = await User.findById(user._id).lean();
    expect(fresh?.email).toBe(originalEmail);
  });
});

// ────────────────────────────────────────────────────────────────────
// Price tampering en creación de orden
// ────────────────────────────────────────────────────────────────────
describe('Price tampering en órdenes', () => {
  const seedProduct = async (unitPrice: number) => {
    const s = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const cat = await Category.create({ name: `Cat ${s}`, slug: `cat-${s}`, level: 0 });
    const prod = await Product.create({
      name: `Prod ${s}`,
      slug: `prod-${s}`,
      description: 'Producto seed anti price-tampering.',
      categories: [cat._id],
      unitPrice,
      saleUnit: { type: 'unidad', quantity: 1 },
      tiers: [],
      active: true,
    });
    return prod._id.toString();
  };

  it('el total se recalcula server-side; los montos del cliente se ignoran', async () => {
    const productId = await seedProduct(1000);

    const res = await request(app)
      .post('/api/orders')
      .send({
        customer: { name: 'Tramposo', phone: '+56912345678' },
        items: [{ productId, quantity: 2, pricePerUnit: 1, subtotal: 1 }], // montos inyectados
        deliveryMethod: 'pickup',
        paymentMethod: 'cash',
        // Intento de forzar los totales de la orden:
        subtotal: 1,
        totalDiscount: 999999,
        total: 1,
      });

    expect(res.status).toBe(201);
    const order = res.body.data.order;
    // 2 unidades * $1000 = $2000, sin descuento
    expect(order.subtotal).toBe(2000);
    expect(order.total).toBe(2000);
    expect(order.totalDiscount).toBe(0);

    // Confirmar en DB también
    const stored = await Order.findById(order._id).lean();
    expect(stored?.total).toBe(2000);
    expect(stored?.items?.[0]?.pricePerUnit).toBe(1000);
  });

  it('mandar un productId inexistente no crea la orden', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/orders')
      .send({
        customer: { name: 'X', phone: '+56912345678' },
        items: [{ productId: fakeId, quantity: 1 }],
        deliveryMethod: 'pickup',
        paymentMethod: 'cash',
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await Order.countDocuments()).toBe(0);
  });
});
