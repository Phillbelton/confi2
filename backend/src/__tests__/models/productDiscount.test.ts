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
 * También fija como contrato (con specs de regresión) que `fixedDiscount`
 * SÍ cambia el precio real en `effectiveUnitPrice` y `buildOrderItems`: el
 * valor con descuento pasa a ser el nuevo precio efectivo, y los `tiers`
 * (precio por volumen) aplican aparte al alcanzar su `minQuantity`. El
 * frontend (`discountCalculator.ts`) replica esta semántica, de modo que el
 * precio mostrado y el cobrado coinciden. Si alguien rompe la paridad
 * front/back, estos specs disparan.
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

describe('contrato de pricing: fixedDiscount SÍ cambia el precio', () => {
  /**
   * fixedDiscount anuncia un cambio de precio real: el valor con descuento
   * pasa a ser el nuevo precio efectivo. effectiveUnitPrice y buildOrderItems
   * lo aplican; los tiers (precio por volumen) aplican aparte. El frontend
   * (lib/discountCalculator.ts) replica esta lógica para que lo mostrado y
   * lo cobrado coincidan.
   */

  it('effectiveUnitPrice aplica el descuento porcentual como nuevo precio base', () => {
    const product = {
      unitPrice: 1000,
      fixedDiscount: { enabled: true, type: 'percentage', value: 50 },
    } as any;
    expect(effectiveUnitPrice(product, 1)).toBe(500);
  });

  it('effectiveUnitPrice aplica el descuento por monto fijo (type "amount")', () => {
    const product = {
      unitPrice: 1000,
      fixedDiscount: { enabled: true, type: 'amount', value: 300 },
    } as any;
    expect(effectiveUnitPrice(product, 1)).toBe(700);
  });

  it('NO aplica una oferta vencida (endDate pasada) → precio de lista', () => {
    const product = {
      unitPrice: 1000,
      fixedDiscount: {
        enabled: true,
        type: 'percentage',
        value: 50,
        endDate: new Date(Date.now() - DAY_MS),
      },
    } as any;
    expect(effectiveUnitPrice(product, 1)).toBe(1000);
  });

  it('buildOrderItems cobra el precio con oferta y registra el descuento', async () => {
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
    // 1000 con 30% OFF → 700 c/u. Subtotal bruto 2000, descuento 600, neto 1400.
    expect(result.subtotal).toBe(2000);
    expect(result.totalDiscount).toBe(600);
    expect(result.orderItems[0].pricePerUnit).toBe(700);
    expect(result.orderItems[0].discount).toBe(600);
    expect(result.orderItems[0].subtotal).toBe(1400);
  });

  it('tiers y fixedDiscount conviven: bajo el tramo manda la oferta, en volumen manda el tramo', async () => {
    const product = await buildProduct({
      unitPrice: 1000,
      tiers: [{ minQuantity: 6, pricePerUnit: 700 }],
      fixedDiscount: { enabled: true, type: 'percentage', value: 20 }, // base 800
    });
    // qty 3 (bajo el tramo) → 800 (precio con oferta)
    const below = await buildOrderItems([
      { productId: product._id.toString(), quantity: 3 },
    ]);
    expect(below.orderItems[0].pricePerUnit).toBe(800);
    // qty 6 (alcanza el tramo) → 700 (precio por volumen, mejor que la oferta)
    const at = await buildOrderItems([
      { productId: product._id.toString(), quantity: 6 },
    ]);
    expect(at.orderItems[0].pricePerUnit).toBe(700);
  });

  it('nunca cobra más que el precio anunciado: si el tramo quedó por encima de la oferta, manda la oferta', async () => {
    const product = await buildProduct({
      unitPrice: 1000,
      tiers: [{ minQuantity: 6, pricePerUnit: 700 }],
      fixedDiscount: { enabled: true, type: 'percentage', value: 50 }, // base 500 < 700
    });
    const at = await buildOrderItems([
      { productId: product._id.toString(), quantity: 6 },
    ]);
    expect(at.orderItems[0].pricePerUnit).toBe(500);
  });
});
