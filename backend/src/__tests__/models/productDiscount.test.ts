import mongoose from 'mongoose';
import Product from '../../models/Product';
import { Category } from '../../models/Category';
import {
  effectiveUnitPrice,
  buildOrderItems,
} from '../../controllers/orderController';

/**
 * Tests de los virtuals de descuento de Product:
 *   - `hasActiveDiscount` evalúa fixedDiscount.enabled + rango de fechas.
 *   - `hasActiveTieredDiscount` es la presencia de tiers no-vacíos.
 *
 * También fija como contrato (con un spec de regresión) que
 * `fixedDiscount` NO se aplica al precio en `effectiveUnitPrice` ni en
 * `buildOrderItems` — solo `tiers` mueve dinero. El frontend
 * (`discountCalculator.ts`) tiene el mismo comportamiento: `fixedDiscount`
 * es solo para el badge visual ("20% OFF"). Esto es decisión de diseño,
 * no bug; el test sirve para detectar si alguien lo cambia sin querer
 * (lo cual desbalancearía precios mostrados vs cobrados).
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

let categoryId: mongoose.Types.ObjectId;

beforeEach(async () => {
  const cat = await Category.create({
    name: `Cat ${Date.now()}-${Math.random()}`,
    slug: `cat-${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
    level: 0,
  });
  categoryId = cat._id as mongoose.Types.ObjectId;
});

const buildProduct = async (overrides: any = {}) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return Product.create({
    name: `Prod ${suffix}`,
    slug: `prod-${suffix}`,
    description: 'Producto seed para tests del virtual.',
    categories: [categoryId],
    unitPrice: 1000,
    saleUnit: { type: 'unidad', quantity: 1 },
    ...overrides,
  });
};

describe('virtual: hasActiveDiscount', () => {
  it('false si el producto NO tiene fixedDiscount', async () => {
    const p = await buildProduct();
    expect(p.hasActiveDiscount).toBe(false);
  });

  it('false si fixedDiscount.enabled = false', async () => {
    const p = await buildProduct({
      fixedDiscount: { enabled: false, type: 'percentage', value: 20 },
    });
    expect(p.hasActiveDiscount).toBe(false);
  });

  it('true si enabled=true y NO hay fechas (siempre vigente)', async () => {
    const p = await buildProduct({
      fixedDiscount: { enabled: true, type: 'percentage', value: 20 },
    });
    expect(p.hasActiveDiscount).toBe(true);
  });

  it('true si startDate ya pasó y no hay endDate', async () => {
    const p = await buildProduct({
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 20,
        startDate: new Date(Date.now() - DAY_MS),
      },
    });
    expect(p.hasActiveDiscount).toBe(true);
  });

  it('false si startDate está en el futuro (todavía no comenzó)', async () => {
    const p = await buildProduct({
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 20,
        startDate: new Date(Date.now() + DAY_MS),
      },
    });
    expect(p.hasActiveDiscount).toBe(false);
  });

  it('false si endDate ya pasó (oferta vencida)', async () => {
    const p = await buildProduct({
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 20,
        endDate: new Date(Date.now() - DAY_MS),
      },
    });
    expect(p.hasActiveDiscount).toBe(false);
  });

  it('true si endDate está en el futuro y no hay startDate', async () => {
    const p = await buildProduct({
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 20,
        endDate: new Date(Date.now() + DAY_MS),
      },
    });
    expect(p.hasActiveDiscount).toBe(true);
  });

  it('true si now está entre startDate y endDate', async () => {
    const p = await buildProduct({
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 20,
        startDate: new Date(Date.now() - DAY_MS),
        endDate: new Date(Date.now() + DAY_MS),
      },
    });
    expect(p.hasActiveDiscount).toBe(true);
  });

  it('false si startDate y endDate están AMBAS en el futuro', async () => {
    const p = await buildProduct({
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 20,
        startDate: new Date(Date.now() + DAY_MS),
        endDate: new Date(Date.now() + 2 * DAY_MS),
      },
    });
    expect(p.hasActiveDiscount).toBe(false);
  });

  it('false si startDate y endDate están AMBAS en el pasado', async () => {
    const p = await buildProduct({
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 20,
        startDate: new Date(Date.now() - 2 * DAY_MS),
        endDate: new Date(Date.now() - DAY_MS),
      },
    });
    expect(p.hasActiveDiscount).toBe(false);
  });

  it('soporta type "amount" igual que "percentage" en el virtual (el virtual solo mira fechas/enabled)', async () => {
    const p = await buildProduct({
      fixedDiscount: { enabled: true, type: 'amount', value: 500 },
    });
    expect(p.hasActiveDiscount).toBe(true);
  });
});

describe('virtual: hasActiveTieredDiscount', () => {
  it('false si tiers no está definido / es array vacío (default)', async () => {
    const p = await buildProduct();
    // El schema da default [] — el virtual lo evalúa como falsy.
    expect(p.hasActiveTieredDiscount).toBe(false);
  });

  it('true si tiers tiene al menos una entrada', async () => {
    const p = await buildProduct({
      tiers: [{ minQuantity: 6, pricePerUnit: 900 }],
    });
    expect(p.hasActiveTieredDiscount).toBe(true);
  });

  it('true si tiers tiene varias entradas', async () => {
    const p = await buildProduct({
      tiers: [
        { minQuantity: 6, pricePerUnit: 900 },
        { minQuantity: 12, pricePerUnit: 800 },
      ],
    });
    expect(p.hasActiveTieredDiscount).toBe(true);
  });
});

describe('contrato de pricing: fixedDiscount NO se aplica al precio', () => {
  /**
   * Tanto effectiveUnitPrice como buildOrderItems IGNORAN fixedDiscount.
   * El frontend (lib/discountCalculator.ts) tiene la misma semántica: el
   * descuento fijo es solo para el badge visual. Si alguien cambia esto
   * sin querer (ej. agrega aplicación de fixedDiscount al precio), estos
   * specs se rompen y obligan a revisar la consistencia front/back.
   *
   * NOTA: Si en el futuro se decide que fixedDiscount SÍ debe aplicar al
   * precio, hay que cambiar:
   *   - backend/src/controllers/orderController.ts → effectiveUnitPrice
   *   - frontend/lib/discountCalculator.ts → effectiveUnitPrice
   * y reemplazar estos tests por los nuevos casos esperados.
   */

  it('effectiveUnitPrice retorna unitPrice aunque haya fixedDiscount activo', () => {
    const product = {
      unitPrice: 1000,
      fixedDiscount: { enabled: true, type: 'percentage', value: 50 },
    } as any;
    // Si fixedDiscount aplicara, el precio sería 500.
    expect(effectiveUnitPrice(product, 1)).toBe(1000);
  });

  it('buildOrderItems no descuenta fixedDiscount: subtotal y total ignoran el badge', async () => {
    const product = await buildProduct({
      unitPrice: 1000,
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 30,
        badge: '30% OFF',
      },
    });
    const result = await buildOrderItems([
      { productId: product._id.toString(), quantity: 2 },
    ]);
    // Si fixedDiscount aplicara, subtotal sería 1400 y discount 600.
    // Como NO aplica, subtotal es 2000 y discount 0.
    expect(result.subtotal).toBe(2000);
    expect(result.totalDiscount).toBe(0);
    expect(result.orderItems[0].pricePerUnit).toBe(1000);
    expect(result.orderItems[0].discount).toBe(0);
  });

  it('cuando hay tiers Y fixedDiscount, solo tiers afecta el precio', async () => {
    const product = await buildProduct({
      unitPrice: 1000,
      tiers: [{ minQuantity: 6, pricePerUnit: 900 }],
      fixedDiscount: { enabled: true, type: 'percentage', value: 50 },
    });
    const result = await buildOrderItems([
      { productId: product._id.toString(), quantity: 6 },
    ]);
    // El tier baja a 900; fixedDiscount NO entra en el cálculo.
    expect(result.orderItems[0].pricePerUnit).toBe(900);
    expect(result.totalDiscount).toBe((1000 - 900) * 6); // 600, no más
  });
});
