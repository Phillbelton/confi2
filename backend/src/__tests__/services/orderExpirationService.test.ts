import mongoose from 'mongoose';
import { Order, IOrder } from '../../models/Order';
import { cancelExpiredGuestOrders } from '../../services/orderExpirationService';
import { ENV } from '../../config/env';

/**
 * Tests del job que cancela órdenes de invitados que llevan más de
 * ORDER_EXPIRATION_HOURS sin confirmarse. Reglas que protegen estos tests:
 *
 * 1. Solo se cancela `status: 'pending_whatsapp'`. Cualquier otro estado
 *    (incluyendo 'cancelled') NO se toca.
 * 2. Solo órdenes de invitado — si `customer.user` está seteado, la orden
 *    es de un cliente registrado y nunca expira.
 * 3. El corte es `createdAt < now - ORDER_EXPIRATION_HOURS*h`. Una orden
 *    creada exactamente en el corte NO debe cancelarse (strict `$lt`).
 */

const HOUR_MS = 60 * 60 * 1000;

const baseOrderFields = () => ({
  customer: { name: 'Cliente Test', phone: '+5491100000000' },
  items: [
    {
      product: new mongoose.Types.ObjectId(),
      productSnapshot: {
        name: 'Producto',
        slug: 'producto',
        unitPrice: 1000,
        saleUnit: { type: 'unidad', quantity: 1 },
        image: '',
      },
      quantity: 1,
      pricePerUnit: 1000,
      discount: 0,
      subtotal: 1000,
    },
  ],
  subtotal: 1000,
  totalDiscount: 0,
  shippingCost: 0,
  total: 1000,
  deliveryMethod: 'pickup',
  paymentMethod: 'cash',
  status: 'pending_whatsapp',
});

/**
 * Crea una orden y le fuerza un `createdAt` específico. Hacemos el update
 * por la colección nativa para evitar que Mongoose toque el timestamp.
 */
const createOrderAt = async (
  createdAt: Date,
  overrides: Partial<IOrder> = {}
): Promise<IOrder> => {
  const order = await Order.create({
    ...baseOrderFields(),
    ...overrides,
  } as Partial<IOrder>);
  await Order.collection.updateOne(
    { _id: order._id },
    { $set: { createdAt } }
  );
  const reloaded = await Order.findById(order._id);
  if (!reloaded) throw new Error('La orden recién creada no se pudo recargar');
  return reloaded;
};

describe('cancelExpiredGuestOrders', () => {
  let hoursAgo: (h: number) => Date;

  beforeEach(() => {
    hoursAgo = (h: number) => new Date(Date.now() - h * HOUR_MS);
  });

  it('retorna 0 cuando no hay órdenes', async () => {
    const cancelled = await cancelExpiredGuestOrders();
    expect(cancelled).toBe(0);
  });

  it('cancela una orden guest pending_whatsapp creada antes del corte', async () => {
    const order = await createOrderAt(hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 1));

    const cancelled = await cancelExpiredGuestOrders();
    expect(cancelled).toBe(1);

    const reloaded = await Order.findById(order._id);
    expect(reloaded?.status).toBe('cancelled');
    expect(reloaded?.cancellationReason).toMatch(/expirada/i);
  });

  it('NO cancela órdenes guest recientes (creadas después del corte)', async () => {
    const order = await createOrderAt(hoursAgo(ENV.ORDER_EXPIRATION_HOURS - 1));

    const cancelled = await cancelExpiredGuestOrders();
    expect(cancelled).toBe(0);

    const reloaded = await Order.findById(order._id);
    expect(reloaded?.status).toBe('pending_whatsapp');
  });

  it('NO cancela una orden creada justo del lado "vivo" del corte (margen 5s)', async () => {
    // El servicio compara contra `now - ORDER_EXPIRATION_HOURS*h` en el
    // momento del run. No podemos reproducir el cutoff exacto, pero sí
    // garantizar que una orden 5s "más reciente" que el corte calculado
    // por el test queda del lado vivo. Detecta regresiones donde el corte
    // pasa de horas a algo más laxo (ej. ms o segundos) o donde $lt se
    // vuelve $lte con tolerancia.
    const order = await createOrderAt(
      new Date(Date.now() - ENV.ORDER_EXPIRATION_HOURS * HOUR_MS + 5000)
    );

    const cancelled = await cancelExpiredGuestOrders();
    expect(cancelled).toBe(0);

    const reloaded = await Order.findById(order._id);
    expect(reloaded?.status).toBe('pending_whatsapp');
  });

  it('NO cancela órdenes de usuarios registrados (customer.user seteado)', async () => {
    const userId = new mongoose.Types.ObjectId();
    const order = await createOrderAt(hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 5), {
      customer: {
        ...baseOrderFields().customer,
        user: userId,
      },
    } as any);

    const cancelled = await cancelExpiredGuestOrders();
    expect(cancelled).toBe(0);

    const reloaded = await Order.findById(order._id);
    expect(reloaded?.status).toBe('pending_whatsapp');
  });

  it('NO toca órdenes ya canceladas (status=cancelled) ni confirma estados terminales', async () => {
    const alreadyCancelled = await createOrderAt(
      hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 10),
      { status: 'cancelled', cancellationReason: 'cancelada por el cliente' } as any
    );

    const cancelled = await cancelExpiredGuestOrders();
    expect(cancelled).toBe(0);

    const reloaded = await Order.findById(alreadyCancelled._id);
    expect(reloaded?.cancellationReason).toBe('cancelada por el cliente');
  });

  it('NO toca órdenes guest confirmadas (status != pending_whatsapp)', async () => {
    const confirmed = await createOrderAt(
      hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 10),
      { status: 'confirmed' } as any
    );

    const cancelled = await cancelExpiredGuestOrders();
    expect(cancelled).toBe(0);

    const reloaded = await Order.findById(confirmed._id);
    expect(reloaded?.status).toBe('confirmed');
  });

  it('procesa varias órdenes en una sola corrida', async () => {
    await createOrderAt(hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 1));
    await createOrderAt(hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 5));
    await createOrderAt(hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 100));
    // Distractor: una guest reciente.
    await createOrderAt(hoursAgo(1));

    const cancelled = await cancelExpiredGuestOrders();
    expect(cancelled).toBe(3);

    const stillPending = await Order.countDocuments({
      status: 'pending_whatsapp',
    });
    expect(stillPending).toBe(1);
  });

  it('una orden que falla al guardar no rompe el job: las demás se cancelan igual', async () => {
    const good = await createOrderAt(hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 1));
    const bad = await createOrderAt(hoursAgo(ENV.ORDER_EXPIRATION_HOURS + 1));

    // Mockear save() del documento "bad" para que falle.
    const originalSave = Order.prototype.save;
    const saveSpy = jest
      .spyOn(Order.prototype, 'save')
      .mockImplementation(async function (this: IOrder, ...args: any[]) {
        if (this._id.toString() === bad._id.toString()) {
          throw new Error('boom');
        }
        return originalSave.apply(this, args);
      });

    try {
      const cancelled = await cancelExpiredGuestOrders();
      // Solo "good" debe haberse cancelado
      expect(cancelled).toBe(1);

      const goodReloaded = await Order.findById(good._id);
      const badReloaded = await Order.findById(bad._id);
      expect(goodReloaded?.status).toBe('cancelled');
      expect(badReloaded?.status).toBe('pending_whatsapp'); // intacta
    } finally {
      saveSpy.mockRestore();
    }
  });
});
