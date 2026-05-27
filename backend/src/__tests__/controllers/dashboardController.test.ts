import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../server';
import { Order } from '../../models/Order';
import Product from '../../models/Product';
import { Category } from '../../models/Category';
import { User, IUser } from '../../models/User';
import { ENV } from '../../config/env';
import type { UserRole } from '../../types';

/**
 * Tests e2e del dashboard admin: contadores, sales-chart, top-products,
 * recent-orders. Cubre la matemática de los $aggregate de Mongoose, que
 * son el camino más fácil para tener bugs silenciosos en cifras que la
 * UI muestra.
 */

const VALID_PASSWORD = 'Password1!';

const createUserAndToken = async (
  role: UserRole = 'admin'
): Promise<{ user: IUser; token: string }> => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({
    name: `User ${role}`,
    email: `${role}-${suffix}@test.com`,
    password: VALID_PASSWORD,
    role,
    active: true,
  });
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    ENV.JWT_SECRET
  );
  return { user, token };
};

/**
 * Crea una orden con `createdAt` fijo (saltando los timestamps de Mongoose
 * para que la fecha persista).
 */
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const createOrderAt = async (
  createdAt: Date,
  overrides: Partial<{
    total: number;
    status: string;
    items: any[];
  }> = {}
) => {
  const order = await Order.create({
    customer: { name: 'X', phone: '+1' },
    items: overrides.items ?? [
      {
        product: new mongoose.Types.ObjectId(),
        productSnapshot: {
          name: 'Producto Default',
          slug: 'producto-default',
          unitPrice: 1000,
          saleUnit: { type: 'unidad', quantity: 1 },
          image: '/img/default.webp',
        },
        quantity: 1,
        pricePerUnit: 1000,
        discount: 0,
        subtotal: 1000,
      },
    ],
    subtotal: overrides.total ?? 1000,
    totalDiscount: 0,
    shippingCost: 0,
    total: overrides.total ?? 1000,
    deliveryMethod: 'pickup',
    paymentMethod: 'cash',
    status: overrides.status ?? 'pending_whatsapp',
  });
  await Order.collection.updateOne(
    { _id: order._id },
    { $set: { createdAt } }
  );
  return Order.findById(order._id);
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/stats
// ────────────────────────────────────────────────────────────────────
describe('GET /api/admin/dashboard/stats', () => {
  it('401 sin auth', async () => {
    const res = await request(app).get('/api/admin/dashboard/stats');
    expect(res.status).toBe(401);
  });

  it('403 si no es admin', async () => {
    const f = await createUserAndToken('funcionario');
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${f.token}`);
    expect(res.status).toBe(403);
  });

  it('agrega ventas por today/week/month correctamente, ignorando canceladas', async () => {
    const { token } = await createUserAndToken('admin');

    // 2 órdenes hoy (1000 + 2000), 1 cancelada hoy (no cuenta)
    await createOrderAt(new Date(Date.now() - HOUR_MS), { total: 1000 });
    await createOrderAt(new Date(Date.now() - 2 * HOUR_MS), { total: 2000 });
    await createOrderAt(new Date(Date.now() - HOUR_MS), {
      total: 9999,
      status: 'cancelled',
    });

    // 1 orden hace 3 días (cuenta para week y month, no para today)
    await createOrderAt(new Date(Date.now() - 3 * DAY_MS), { total: 500 });

    // 1 orden hace 20 días (cuenta solo para month)
    await createOrderAt(new Date(Date.now() - 20 * DAY_MS), { total: 700 });

    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    expect(res.body.data.todayOrders).toBe(2);
    expect(res.body.data.todaySales).toBe(3000);
    expect(res.body.data.weekSales).toBe(3000 + 500);
    expect(res.body.data.monthSales).toBe(3000 + 500 + 700);
  });

  it('cuenta pendingOrders = pending_whatsapp + confirmed', async () => {
    const { token } = await createUserAndToken('admin');
    await createOrderAt(startOfToday(), { status: 'pending_whatsapp' });
    await createOrderAt(startOfToday(), { status: 'confirmed' });
    await createOrderAt(startOfToday(), { status: 'completed' }); // no cuenta
    await createOrderAt(startOfToday(), { status: 'cancelled' }); // no cuenta

    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.pendingOrders).toBe(2);
  });

  it('totalProducts = activos; totalCustomers = role cliente + active', async () => {
    const { token } = await createUserAndToken('admin');

    const cat = await Category.create({
      name: 'Cat dashboard', slug: 'cat-dashboard', level: 0,
    });
    await Product.create({
      name: 'Prod Activo', slug: 'p1-dash',
      description: 'descripción de seed para tests del dashboard',
      categories: [cat._id], unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 }, active: true,
    });
    await Product.create({
      name: 'Prod Inactivo', slug: 'p2-dash',
      description: 'descripción de seed para tests del dashboard',
      categories: [cat._id], unitPrice: 2000,
      saleUnit: { type: 'unidad', quantity: 1 }, active: false,
    });
    // Clientes
    await createUserAndToken('cliente');
    await createUserAndToken('cliente');
    // Otro funcionario adicional al beforeEach
    await createUserAndToken('funcionario');

    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.totalProducts).toBe(1); // solo P1 está active
    expect(res.body.data.totalCustomers).toBe(2);
  });

  it('cuando no hay órdenes, todos los agregados retornan 0', async () => {
    const { token } = await createUserAndToken('admin');
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.todayOrders).toBe(0);
    expect(res.body.data.todaySales).toBe(0);
    expect(res.body.data.weekSales).toBe(0);
    expect(res.body.data.monthSales).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/sales-chart
// ────────────────────────────────────────────────────────────────────
describe('GET /api/admin/dashboard/sales-chart', () => {
  it('rellena días sin ventas con sales=0 y orders=0', async () => {
    const { token } = await createUserAndToken('admin');

    // Hace 5 días una orden, hace 2 días otra
    await createOrderAt(new Date(Date.now() - 5 * DAY_MS), { total: 1000 });
    await createOrderAt(new Date(Date.now() - 2 * DAY_MS), { total: 2000 });

    const res = await request(app)
      .get('/api/admin/dashboard/sales-chart?days=7')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(7);
    // Cada item debe tener date + sales + orders
    for (const d of res.body.data) {
      expect(typeof d.date).toBe('string');
      expect(typeof d.sales).toBe('number');
      expect(typeof d.orders).toBe('number');
    }
    // La serie debe contener exactamente 2 días con ventas
    const withSales = res.body.data.filter((d: any) => d.sales > 0);
    expect(withSales).toHaveLength(2);
    expect(withSales.map((d: any) => d.sales).sort()).toEqual([1000, 2000]);
  });

  it('default days=30 si no se especifica query', async () => {
    const { token } = await createUserAndToken('admin');
    const res = await request(app)
      .get('/api/admin/dashboard/sales-chart')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data).toHaveLength(30);
  });
});

// ────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/top-products
// ────────────────────────────────────────────────────────────────────
describe('GET /api/admin/dashboard/top-products', () => {
  /**
   * Regresión: este endpoint agrupaba por items.variantSnapshot.name
   * cuando el campo real es items.productSnapshot.name (modelo plano
   * actual). Antes del fix, retornaba una sola fila con name=null.
   */
  it('agrupa por productSnapshot.name y ordena por revenue descendente', async () => {
    const { token } = await createUserAndToken('admin');

    // 2 órdenes con productos distintos
    const mkItem = (
      name: string, quantity: number, subtotal: number, image = ''
    ) => ({
      product: new mongoose.Types.ObjectId(),
      productSnapshot: {
        name, slug: name.toLowerCase(),
        unitPrice: subtotal / quantity,
        saleUnit: { type: 'unidad', quantity: 1 },
        image,
      },
      quantity,
      pricePerUnit: subtotal / quantity,
      discount: 0,
      subtotal,
    });

    await createOrderAt(new Date(Date.now() - HOUR_MS), {
      total: 10000,
      items: [
        mkItem('Torta A', 2, 6000, '/img/a.webp'),
        mkItem('Galletas B', 4, 4000, '/img/b.webp'),
      ],
    });
    await createOrderAt(new Date(Date.now() - 2 * HOUR_MS), {
      total: 12000,
      items: [
        mkItem('Torta A', 4, 12000), // +12000 para Torta A
      ],
    });

    const res = await request(app)
      .get('/api/admin/dashboard/top-products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    // Top 1: Torta A → revenue 18000, totalSold 6
    expect(res.body.data[0]).toMatchObject({
      name: 'Torta A',
      totalSold: 6,
      revenue: 18000,
    });
    // Top 2: Galletas B → revenue 4000, totalSold 4
    expect(res.body.data[1]).toMatchObject({
      name: 'Galletas B',
      totalSold: 4,
      revenue: 4000,
    });
    // El campo image debe traerse del snapshot (no null como antes del bug)
    expect(res.body.data[0].image).toBe('/img/a.webp');
  });

  it('excluye órdenes canceladas', async () => {
    const { token } = await createUserAndToken('admin');
    await createOrderAt(new Date(Date.now() - HOUR_MS), {
      total: 9999,
      status: 'cancelled',
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          productSnapshot: {
            name: 'Cancelada', slug: 'cancelada',
            unitPrice: 9999,
            saleUnit: { type: 'unidad', quantity: 1 },
            image: '',
          },
          quantity: 1, pricePerUnit: 9999, discount: 0, subtotal: 9999,
        },
      ],
    });

    const res = await request(app)
      .get('/api/admin/dashboard/top-products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data).toEqual([]);
  });

  it('respeta el query param limit', async () => {
    const { token } = await createUserAndToken('admin');
    const mkItem = (name: string, subtotal: number) => ({
      product: new mongoose.Types.ObjectId(),
      productSnapshot: {
        name, slug: name.toLowerCase(),
        unitPrice: subtotal,
        saleUnit: { type: 'unidad', quantity: 1 },
        image: '',
      },
      quantity: 1, pricePerUnit: subtotal, discount: 0, subtotal,
    });
    await createOrderAt(new Date(Date.now() - HOUR_MS), {
      items: [mkItem('P1', 100), mkItem('P2', 200), mkItem('P3', 300)],
      total: 600,
    });

    const res = await request(app)
      .get('/api/admin/dashboard/top-products?limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe('P3');
    expect(res.body.data[1].name).toBe('P2');
  });
});

// ────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/recent-orders
// ────────────────────────────────────────────────────────────────────
describe('GET /api/admin/dashboard/recent-orders', () => {
  it('ordena DESC por createdAt y respeta limit', async () => {
    const { token } = await createUserAndToken('admin');
    await createOrderAt(new Date(Date.now() - 5 * DAY_MS), { total: 100 });
    await createOrderAt(new Date(Date.now() - 1 * DAY_MS), { total: 200 });
    await createOrderAt(new Date(Date.now() - 3 * DAY_MS), { total: 300 });

    const res = await request(app)
      .get('/api/admin/dashboard/recent-orders?limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    // El más reciente primero
    expect(res.body.data[0].total).toBe(200);
    expect(res.body.data[1].total).toBe(300);
  });
});
