import mongoose from 'mongoose';
import Product from '../../models/Product';
import { Category } from '../../models/Category';
import {
  effectiveUnitPrice,
  buildOrderItems,
  type PriceableProduct,
} from '../../controllers/orderController';
import { AppError } from '../../middleware/errorHandler';

/**
 * Estos tests cubren la lógica de precios y tiers que determina lo que el
 * cliente paga. Es código crítico — un bug silencioso aquí significa cobrar
 * de menos (o de más) durante todo un período.
 *
 * - `effectiveUnitPrice` se prueba en aislamiento (puro, sin DB).
 * - `buildOrderItems` se prueba contra mongodb-memory-server porque hace
 *   `Product.findById(...).lean()` y `Math.max(0, ...)` que solo se ve si
 *   trabajamos con docs reales del modelo.
 */

describe('effectiveUnitPrice (lógica pura de tiers)', () => {
  it('retorna unitPrice si el producto no tiene tiers', () => {
    const product: PriceableProduct = { unitPrice: 1000 };
    expect(effectiveUnitPrice(product, 1)).toBe(1000);
    expect(effectiveUnitPrice(product, 100)).toBe(1000);
  });

  it('retorna unitPrice si tiers está vacío', () => {
    const product: PriceableProduct = { unitPrice: 1000, tiers: [] };
    expect(effectiveUnitPrice(product, 50)).toBe(1000);
  });

  it('retorna unitPrice si la cantidad NO alcanza el minQuantity del tier más bajo', () => {
    const product: PriceableProduct = {
      unitPrice: 1000,
      tiers: [{ minQuantity: 12, pricePerUnit: 900 }],
    };
    expect(effectiveUnitPrice(product, 11)).toBe(1000);
    expect(effectiveUnitPrice(product, 1)).toBe(1000);
  });

  it('aplica el tier cuando la cantidad iguala exactamente el minQuantity', () => {
    const product: PriceableProduct = {
      unitPrice: 1000,
      tiers: [{ minQuantity: 12, pricePerUnit: 900 }],
    };
    expect(effectiveUnitPrice(product, 12)).toBe(900);
  });

  it('aplica el tier cuando la cantidad supera el minQuantity', () => {
    const product: PriceableProduct = {
      unitPrice: 1000,
      tiers: [{ minQuantity: 12, pricePerUnit: 900 }],
    };
    expect(effectiveUnitPrice(product, 50)).toBe(900);
  });

  it('elige el tier de mayor minQuantity que se alcance (intermedio)', () => {
    const product: PriceableProduct = {
      unitPrice: 1000,
      tiers: [
        { minQuantity: 6, pricePerUnit: 950 },
        { minQuantity: 12, pricePerUnit: 900 },
        { minQuantity: 24, pricePerUnit: 800 },
      ],
    };
    expect(effectiveUnitPrice(product, 5)).toBe(1000); // ningún tier
    expect(effectiveUnitPrice(product, 6)).toBe(950); // primer tier
    expect(effectiveUnitPrice(product, 11)).toBe(950); // sigue en 1er tier
    expect(effectiveUnitPrice(product, 12)).toBe(900); // entra 2do tier
    expect(effectiveUnitPrice(product, 23)).toBe(900); // sigue en 2do
    expect(effectiveUnitPrice(product, 24)).toBe(800); // entra 3er tier
    expect(effectiveUnitPrice(product, 100)).toBe(800); // mucho más
  });

  it('no depende del orden en que vengan los tiers en el input', () => {
    const product: PriceableProduct = {
      unitPrice: 1000,
      tiers: [
        { minQuantity: 24, pricePerUnit: 800 },
        { minQuantity: 6, pricePerUnit: 950 },
        { minQuantity: 12, pricePerUnit: 900 },
      ],
    };
    expect(effectiveUnitPrice(product, 24)).toBe(800);
    expect(effectiveUnitPrice(product, 12)).toBe(900);
    expect(effectiveUnitPrice(product, 6)).toBe(950);
  });

  it('no muta el array `tiers` del producto', () => {
    const tiers = [
      { minQuantity: 24, pricePerUnit: 800 },
      { minQuantity: 6, pricePerUnit: 950 },
    ];
    const snapshot = JSON.stringify(tiers);
    const product: PriceableProduct = { unitPrice: 1000, tiers };
    effectiveUnitPrice(product, 50);
    expect(JSON.stringify(tiers)).toBe(snapshot);
  });

  it('soporta tier con minQuantity=1 (siempre aplica)', () => {
    const product: PriceableProduct = {
      unitPrice: 1000,
      tiers: [{ minQuantity: 1, pricePerUnit: 900 }],
    };
    expect(effectiveUnitPrice(product, 1)).toBe(900);
    expect(effectiveUnitPrice(product, 99)).toBe(900);
  });
});

describe('buildOrderItems (integración con DB)', () => {
  let categoryId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const category = await Category.create({
      name: `Cat ${Date.now()}-${Math.random()}`,
      slug: `cat-${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
      level: 0,
    });
    categoryId = category._id as mongoose.Types.ObjectId;
  });

  const createProduct = async (overrides: Partial<{
    name: string;
    unitPrice: number;
    tiers: { minQuantity: number; pricePerUnit: number; label?: string }[];
    active: boolean;
  }> = {}) => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return Product.create({
      name: overrides.name ?? `Producto ${suffix}`,
      slug: `producto-${suffix}`,
      description: 'Descripción de prueba con largo suficiente.',
      categories: [categoryId],
      unitPrice: overrides.unitPrice ?? 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      tiers: overrides.tiers ?? [],
      active: overrides.active ?? true,
    });
  };

  it('rechaza productId inválido con 400', async () => {
    await expect(
      buildOrderItems([{ productId: 'no-es-un-objectid', quantity: 1 }])
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('productId inválido'),
    });
  });

  it('rechaza producto inexistente con 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      buildOrderItems([{ productId: fakeId, quantity: 1 }])
    ).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('no disponible'),
    });
  });

  it('rechaza producto inactivo con 404 (no debe poder cobrarse)', async () => {
    const product = await createProduct({ active: false });
    await expect(
      buildOrderItems([{ productId: product._id.toString(), quantity: 1 }])
    ).rejects.toBeInstanceOf(AppError);
  });

  it('producto sin tiers: subtotal = unitPrice × qty, discount = 0', async () => {
    const product = await createProduct({ unitPrice: 1000, tiers: [] });
    const result = await buildOrderItems([
      { productId: product._id.toString(), quantity: 3 },
    ]);

    expect(result.subtotal).toBe(3000);
    expect(result.totalDiscount).toBe(0);
    expect(result.orderItems).toHaveLength(1);
    expect(result.orderItems[0]).toMatchObject({
      quantity: 3,
      pricePerUnit: 1000,
      discount: 0,
      subtotal: 3000,
    });
  });

  it('producto con tier alcanzado: descuento = (unitPrice − ppu) × qty', async () => {
    const product = await createProduct({
      unitPrice: 1000,
      tiers: [{ minQuantity: 12, pricePerUnit: 900 }],
    });
    const result = await buildOrderItems([
      { productId: product._id.toString(), quantity: 12 },
    ]);

    // subtotal en el response es el SIN descuento (a precio de lista)
    expect(result.subtotal).toBe(1000 * 12);
    expect(result.totalDiscount).toBe((1000 - 900) * 12);
    // el line subtotal es a precio efectivo
    expect(result.orderItems[0]).toMatchObject({
      pricePerUnit: 900,
      discount: 1200,
      subtotal: 900 * 12, // 10_800
    });
  });

  it('producto con tier NO alcanzado: subtotal sin descuento', async () => {
    const product = await createProduct({
      unitPrice: 1000,
      tiers: [{ minQuantity: 12, pricePerUnit: 900 }],
    });
    const result = await buildOrderItems([
      { productId: product._id.toString(), quantity: 11 },
    ]);
    expect(result.totalDiscount).toBe(0);
    expect(result.orderItems[0].pricePerUnit).toBe(1000);
  });

  it('múltiples productos: suma subtotal y descuentos por línea', async () => {
    const cheap = await createProduct({
      unitPrice: 500,
      tiers: [],
    });
    const tiered = await createProduct({
      unitPrice: 1000,
      tiers: [{ minQuantity: 6, pricePerUnit: 900 }],
    });

    const result = await buildOrderItems([
      { productId: cheap._id.toString(), quantity: 2 }, // 500×2 = 1000, sin desc
      { productId: tiered._id.toString(), quantity: 6 }, // 1000×6 = 6000, desc = 100×6 = 600
    ]);

    expect(result.subtotal).toBe(1000 + 6000);
    expect(result.totalDiscount).toBe(600);
    expect(result.orderItems).toHaveLength(2);
  });

  it('protege contra "tier negativo": discount no puede ser < 0 si ppu > unitPrice', async () => {
    // Defensa de Math.max(0, ...). Un tier con pricePerUnit > unitPrice no
    // tiene sentido de negocio (sería un recargo, no un descuento) pero el
    // schema no lo prohíbe — el código debe NO generar un descuento negativo.
    const product = await createProduct({
      unitPrice: 1000,
      tiers: [{ minQuantity: 1, pricePerUnit: 1200 }],
    });
    const result = await buildOrderItems([
      { productId: product._id.toString(), quantity: 1 },
    ]);
    expect(result.totalDiscount).toBe(0);
    expect(result.orderItems[0].discount).toBe(0);
    // y el pricePerUnit sí refleja el tier (correcto o no)
    expect(result.orderItems[0].pricePerUnit).toBe(1200);
  });

  it('snapshot del item: name/slug/unitPrice/saleUnit/image se copian al pedido', async () => {
    const product = await createProduct({ unitPrice: 1000 });
    const result = await buildOrderItems([
      { productId: product._id.toString(), quantity: 1 },
    ]);
    const snap = result.orderItems[0].productSnapshot;
    expect(snap.name).toBe(product.name);
    expect(snap.slug).toBe(product.slug);
    expect(snap.unitPrice).toBe(1000);
    expect(snap.saleUnit).toMatchObject({ type: 'unidad', quantity: 1 });
    // sin imágenes: image debe ser '' (no undefined)
    expect(snap.image).toBe('');
  });
});
