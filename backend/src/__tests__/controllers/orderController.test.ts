import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import Product from '../../models/Product';
import { Category } from '../../models/Category';
import { User, IUser } from '../../models/User';
import { Order } from '../../models/Order';
import { signTokenFor } from '../setup/authTestHelpers';
import { emailService } from '../../services/emailService';
import type { UserRole } from '../../types';

/**
 * Tests e2e del flow completo de órdenes vía supertest.
 *
 * El módulo orderPricing.test.ts ya cubre `effectiveUnitPrice` y
 * `buildOrderItems` en aislamiento; acá probamos los endpoints reales
 * (validación Zod, persistencia, transiciones de estado, dinero final).
 */

const VALID_PASSWORD = 'Password1!';

const createUserAndToken = async (
  role: UserRole = 'cliente'
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

const seedProduct = async (
  categoryId: mongoose.Types.ObjectId,
  overrides: Partial<{
    unitPrice: number;
    tiers: { minQuantity: number; pricePerUnit: number }[];
    active: boolean;
  }> = {}
) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return Product.create({
    name: `Prod ${suffix}`,
    slug: `prod-${suffix}`,
    description: 'Producto seed para tests de orden.',
    categories: [categoryId],
    unitPrice: overrides.unitPrice ?? 1000,
    saleUnit: { type: 'unidad', quantity: 1 },
    tiers: overrides.tiers ?? [],
    active: overrides.active ?? true,
  });
};

const seedCategory = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return Category.create({
    name: `Cat ${suffix}`,
    slug: `cat-${suffix}`,
    level: 0,
  });
};

const guestCustomer = () => ({
  name: 'Juana Pérez',
  phone: '+56912345678',
  email: 'juana@test.com',
});

const baseOrderBody = (productId: string) => ({
  customer: guestCustomer(),
  items: [{ productId, quantity: 3 }],
  deliveryMethod: 'pickup' as const,
  paymentMethod: 'cash' as const,
});

// ────────────────────────────────────────────────────────────────────
// POST /api/orders/validate-cart
// ────────────────────────────────────────────────────────────────────
describe('POST /api/orders/validate-cart', () => {
  it('previsualiza subtotal/discount/total sin crear orden', async () => {
    const cat = await seedCategory();
    const prod = await seedProduct(cat._id as mongoose.Types.ObjectId, {
      unitPrice: 1000,
      tiers: [{ minQuantity: 6, pricePerUnit: 900 }],
    });

    const res = await request(app)
      .post('/api/orders/validate-cart')
      .send({ items: [{ productId: prod._id.toString(), quantity: 6 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.subtotal).toBe(1000 * 6);
    expect(res.body.data.totalDiscount).toBe((1000 - 900) * 6);
    expect(res.body.data.total).toBe(900 * 6);

    // Y NO se persistió ninguna orden
    const orderCount = await Order.countDocuments();
    expect(orderCount).toBe(0);
  });

  it('400 si items está vacío', async () => {
    const res = await request(app)
      .post('/api/orders/validate-cart')
      .send({ items: [] });
    expect(res.status).toBe(400);
  });
});

// ────────────────────────────────────────────────────────────────────
// POST /api/orders (createOrder, optionalAuth)
// ────────────────────────────────────────────────────────────────────
describe('POST /api/orders', () => {
  let categoryId: mongoose.Types.ObjectId;
  let productId: string;

  beforeEach(async () => {
    const cat = await seedCategory();
    categoryId = cat._id as mongoose.Types.ObjectId;
    const prod = await seedProduct(categoryId, { unitPrice: 1000 });
    productId = prod._id.toString();
  });

  it('crea una orden guest (sin auth) con status=pending_whatsapp y customer.user undefined', async () => {
    const res = await request(app).post('/api/orders').send(baseOrderBody(productId));

    expect(res.status).toBe(201);
    expect(res.body.data.order.status).toBe('pending_whatsapp');
    expect(res.body.data.order.whatsappSent).toBe(false);
    expect(res.body.data.order.customer.user).toBeUndefined();
    expect(res.body.data.order.orderNumber).toMatch(/^QUE-\d{8}-\d{3}$/);
  });

  it('vincula customer.user al usuario autenticado cuando hay token', async () => {
    const { user, token } = await createUserAndToken('cliente');

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(baseOrderBody(productId));

    expect(res.status).toBe(201);
    expect(res.body.data.order.customer.user).toBe(user._id.toString());
  });

  it('calcula subtotal/totalDiscount/shippingCost/total con tiers', async () => {
    const prodTier = await seedProduct(categoryId, {
      unitPrice: 1000,
      tiers: [{ minQuantity: 6, pricePerUnit: 900 }],
    });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customer: guestCustomer(),
        items: [{ productId: prodTier._id.toString(), quantity: 6 }],
        deliveryMethod: 'delivery',
        paymentMethod: 'transfer',
      });

    expect(res.status).toBe(201);
    const o = res.body.data.order;
    expect(o.subtotal).toBe(6000);
    expect(o.totalDiscount).toBe(600);
    expect(o.shippingCost).toBe(0);
    expect(o.total).toBe(5400); // 6000 - 600 + 0
  });

  it('400 si Zod rechaza (items vacío)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...baseOrderBody(productId), items: [] });
    expect(res.status).toBe(400);
  });

  it('400 si Zod rechaza (deliveryMethod inválido)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...baseOrderBody(productId), deliveryMethod: 'paloma-mensajera' });
    expect(res.status).toBe(400);
  });

  it('400 si Zod rechaza (paymentMethod inválido)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...baseOrderBody(productId), paymentMethod: 'criptomonedas' });
    expect(res.status).toBe(400);
  });

  it('400 si productId no tiene 24 caracteres (Zod)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...baseOrderBody(productId),
        items: [{ productId: 'no-24-chars', quantity: 1 }],
      });
    expect(res.status).toBe(400);
  });

  it('404 si el producto del item no existe', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...baseOrderBody(productId),
        items: [{ productId: fakeId, quantity: 1 }],
      });
    expect(res.status).toBe(404);
  });

  it('404 si el producto está inactivo (no se puede ordenar)', async () => {
    const inactive = await seedProduct(categoryId, { active: false });
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...baseOrderBody(productId),
        items: [{ productId: inactive._id.toString(), quantity: 1 }],
      });
    expect(res.status).toBe(404);
  });

  it('envía el email de "pedido recibido" cuando el cliente dejó email', async () => {
    const sendReceived = emailService.sendOrderReceivedEmail as jest.Mock;
    const res = await request(app).post('/api/orders').send(baseOrderBody(productId));

    expect(res.status).toBe(201);
    expect(sendReceived).toHaveBeenCalledTimes(1);
    // firma: (order, userEmail, userName)
    const [, toEmail, toName] = sendReceived.mock.calls[0];
    expect(toEmail).toBe('juana@test.com');
    expect(toName).toBe('Juana Pérez');
  });

  it('NO intenta enviar email si el cliente no dejó email', async () => {
    const sendReceived = emailService.sendOrderReceivedEmail as jest.Mock;
    const res = await request(app)
      .post('/api/orders')
      .send({
        customer: { name: 'Sin Email', phone: '+56912345678' },
        items: [{ productId, quantity: 1 }],
        deliveryMethod: 'pickup',
        paymentMethod: 'cash',
      });

    expect(res.status).toBe(201);
    expect(sendReceived).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────
// GET /api/orders/my-orders (cliente only)
// ────────────────────────────────────────────────────────────────────
describe('GET /api/orders/my-orders', () => {
  it('un cliente ve solo SUS órdenes, no las de otros', async () => {
    const cat = await seedCategory();
    const prod = await seedProduct(cat._id as mongoose.Types.ObjectId);
    const productId = prod._id.toString();

    const alice = await createUserAndToken('cliente');
    const bob = await createUserAndToken('cliente');

    // Alice crea 2, Bob crea 1
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${alice.token}`)
      .send(baseOrderBody(productId));
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${alice.token}`)
      .send(baseOrderBody(productId));
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${bob.token}`)
      .send(baseOrderBody(productId));

    const aliceList = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${alice.token}`);
    expect(aliceList.status).toBe(200);
    expect(aliceList.body.data.orders).toHaveLength(2);
    for (const o of aliceList.body.data.orders) {
      expect(o.customer.user.toString()).toBe(alice.user._id.toString());
    }

    const bobList = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${bob.token}`);
    expect(bobList.body.data.orders).toHaveLength(1);
  });
});

// ────────────────────────────────────────────────────────────────────
// PUT /api/orders/:id/status, /confirm, /items, /shipping (admin+funcionario)
// ────────────────────────────────────────────────────────────────────
describe('transiciones de orden (admin/funcionario)', () => {
  let funcionarioToken: string;
  let orderId: string;
  let productIdAlt: string;
  let categoryId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const { token } = await createUserAndToken('funcionario');
    funcionarioToken = token;

    const cat = await seedCategory();
    categoryId = cat._id as mongoose.Types.ObjectId;
    const prod = await seedProduct(categoryId, { unitPrice: 1000 });
    const prodAlt = await seedProduct(categoryId, { unitPrice: 2000 });
    productIdAlt = prodAlt._id.toString();

    const create = await request(app)
      .post('/api/orders')
      .send(baseOrderBody(prod._id.toString()));
    orderId = create.body.data.order._id;
  });

  it('PUT /confirm cambia status a confirmed (shippingCost requerido por Zod)', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({ shippingCost: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('confirmed');
  });

  it('PUT /confirm sin shippingCost → 400 (Zod)', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('PUT /status acepta status del enum y rechaza valores inválidos', async () => {
    const ok = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({ status: 'preparing' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.order.status).toBe('preparing');

    const bad = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({ status: 'inventado' });
    expect(bad.status).toBe(400);
  });

  it('PUT /items recalcula subtotal/discount/total preservando shippingCost', async () => {
    // Primero seteamos shipping=5000
    await request(app)
      .put(`/api/orders/${orderId}/shipping`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({ shippingCost: 5000 });

    // Reemplazamos items por el producto alternativo (unitPrice=2000) × 2
    const res = await request(app)
      .put(`/api/orders/${orderId}/items`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({ items: [{ productId: productIdAlt, quantity: 2 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.order.subtotal).toBe(4000);
    expect(res.body.data.order.totalDiscount).toBe(0);
    expect(res.body.data.order.shippingCost).toBe(5000); // preservado
    expect(res.body.data.order.total).toBe(9000); // 4000 + 5000
  });

  it('PUT /shipping recalcula total = subtotal - discount + shipping', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/shipping`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({ shippingCost: 7000 });

    expect(res.status).toBe(200);
    // Orden inicial: 3 × 1000 sin descuento → subtotal=3000, total=3000+7000=10000
    expect(res.body.data.order.shippingCost).toBe(7000);
    expect(res.body.data.order.total).toBe(10000);
  });

  it('PUT /:id/* devuelve 404 si la orden no existe', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/orders/${fakeId}/status`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
  });

  it('PUT /:id/whatsapp-sent marca whatsappSent=true y setea whatsappSentAt', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/whatsapp-sent`)
      .set('Authorization', `Bearer ${funcionarioToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.order.whatsappSent).toBe(true);
    expect(res.body.data.order.whatsappSentAt).toBeDefined();
  });
});

// ────────────────────────────────────────────────────────────────────
// PUT /api/orders/:id/cancel
// ────────────────────────────────────────────────────────────────────
describe('PUT /api/orders/:id/cancel', () => {
  it('cancela una orden con motivo y devuelve status=cancelled', async () => {
    const { token } = await createUserAndToken('admin');
    const cat = await seedCategory();
    const prod = await seedProduct(cat._id as mongoose.Types.ObjectId);
    const create = await request(app)
      .post('/api/orders')
      .send(baseOrderBody(prod._id.toString()));
    const orderId = create.body.data.order._id;

    const res = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cancellationReason: 'El cliente cambió de opinión' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('cancelled');
    expect(res.body.data.order.cancellationReason).toMatch(/cambió/i);
  });

  it('400 si el motivo de cancelación es muy corto (Zod min 10)', async () => {
    const { token } = await createUserAndToken('admin');
    const cat = await seedCategory();
    const prod = await seedProduct(cat._id as mongoose.Types.ObjectId);
    const create = await request(app)
      .post('/api/orders')
      .send(baseOrderBody(prod._id.toString()));
    const orderId = create.body.data.order._id;

    const res = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cancellationReason: 'corto' });

    expect(res.status).toBe(400);
  });
});
