import mongoose from 'mongoose';
import Product from '../../models/Product';
import { Category } from '../../models/Category';
import { buildOrderItems, rebuildOrderItems } from '../../controllers/orderController';

/**
 * Reglas de precio al EDITAR un pedido ya existente.
 *
 * La decisión de negocio es: se congela la ESCALERA vigente al comprar (precio
 * base + tramos + oferta), no el precio final. Eso permite que quien sube la
 * cantidad siga accediendo a sus tramos por volumen, sin que una suba de
 * precios posterior le encarezca lo que ya había pactado. Si el catálogo bajó,
 * se le pasa la rebaja.
 *
 * Es la parte del sistema que decide cuánto se le cobra a alguien que ya
 * aceptó un total, así que conviene tenerla clavada con tests.
 */

describe('rebuildOrderItems — precios al editar un pedido', () => {
  let categoryId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const category = await Category.create({
      name: `Cat ${Date.now()}-${Math.random()}`,
      slug: `cat-${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
      level: 0,
    });
    categoryId = category._id as mongoose.Types.ObjectId;
  });

  const createProduct = async (
    overrides: Partial<{
      unitPrice: number;
      tiers: { minQuantity: number; pricePerUnit: number }[];
      active: boolean;
    }> = {}
  ) => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return Product.create({
      name: `Producto ${suffix}`,
      slug: `producto-${suffix}`,
      description: 'Descripción de prueba con largo suficiente.',
      categories: [categoryId],
      unitPrice: overrides.unitPrice ?? 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      tiers: overrides.tiers ?? [],
      active: overrides.active ?? true,
    });
  };

  /**
   * Cambia el precio del catálogo como lo haría el admin.
   * Ojo: el pricing lee de `presentaciones[]`, así que tocar solo el
   * `unitPrice` legacy no cambiaría nada de lo que se cobra.
   */
  const setCatalogPrice = async (productId: mongoose.Types.ObjectId, price: number) => {
    const doc = await Product.findById(productId);
    doc!.unitPrice = price;
    for (const pres of doc!.presentaciones ?? []) {
      if (pres.principal) pres.unitPrice = price;
    }
    await doc!.save();
  };

  /** Arma un pedido real (con la escalera congelada) para después editarlo. */
  const makeOrder = async (
    productId: string,
    quantity: number,
    presentationId?: string
  ) => {
    const { orderItems, subtotal, totalDiscount } = await buildOrderItems([
      { productId, quantity, presentationId },
    ]);
    return {
      items: orderItems,
      subtotal,
      totalDiscount,
      total: subtotal - totalDiscount,
    };
  };

  it('congela el precio: si el catálogo sube, el cliente sigue pagando lo pactado', async () => {
    const product = await createProduct({ unitPrice: 1000 });
    const order = await makeOrder(String(product._id), 3);

    // El negocio sube el precio después de que el cliente pidió
    await setCatalogPrice(product._id as mongoose.Types.ObjectId, 1500);

    const { orderItems } = await rebuildOrderItems(order, [
      { productId: String(product._id), quantity: 5 },
    ]);

    expect(orderItems[0].pricePerUnit).toBe(1000);
    expect(orderItems[0].subtotal).toBe(5000);
  });

  it('si el catálogo BAJA, se le pasa la rebaja (nunca se cobra de más)', async () => {
    const product = await createProduct({ unitPrice: 1000 });
    const order = await makeOrder(String(product._id), 2);

    await setCatalogPrice(product._id as mongoose.Types.ObjectId, 800);

    const { orderItems } = await rebuildOrderItems(order, [
      { productId: String(product._id), quantity: 2 },
    ]);

    expect(orderItems[0].pricePerUnit).toBe(800);
  });

  it('al subir la cantidad aplica el tramo por volumen de la escalera congelada', async () => {
    // Este es el caso que se rompería si congeláramos el precio final en vez
    // de la escalera: el cliente compra más y se quedaría sin su descuento.
    const product = await createProduct({
      unitPrice: 1000,
      tiers: [{ minQuantity: 50, pricePerUnit: 900 }],
    });
    const order = await makeOrder(String(product._id), 3);
    expect(order.items[0].pricePerUnit).toBe(1000);

    const { orderItems } = await rebuildOrderItems(order, [
      { productId: String(product._id), quantity: 60 },
    ]);

    expect(orderItems[0].pricePerUnit).toBe(900);
    expect(orderItems[0].subtotal).toBe(54000);
  });

  it('una línea nueva se cotiza al precio de hoy, no al del pedido', async () => {
    const viejo = await createProduct({ unitPrice: 1000 });
    const order = await makeOrder(String(viejo._id), 1);

    const nuevo = await createProduct({ unitPrice: 2500 });
    const { orderItems, changes } = await rebuildOrderItems(order, [
      { productId: String(viejo._id), quantity: 1 },
      { productId: String(nuevo._id), quantity: 2 },
    ]);

    expect(orderItems).toHaveLength(2);
    expect(orderItems[1].pricePerUnit).toBe(2500);
    expect(changes).toContainEqual(
      expect.objectContaining({ kind: 'added', after: 2 })
    );
  });

  it('permite editar un pedido cuyo producto fue dado de baja del catálogo', async () => {
    // Antes esto era imposible: el recálculo tiraba 404 y bloqueaba el pedido
    // entero, aunque solo se quisiera tocar otra línea.
    const product = await createProduct({ unitPrice: 1000 });
    const order = await makeOrder(String(product._id), 2);

    await Product.findByIdAndUpdate(product._id, { active: false });

    const { orderItems } = await rebuildOrderItems(order, [
      { productId: String(product._id), quantity: 4 },
    ]);

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].pricePerUnit).toBe(1000);
    expect(orderItems[0].quantity).toBe(4);
  });

  it('cantidad 0 elimina la línea y lo registra como quitada', async () => {
    const a = await createProduct({ unitPrice: 1000 });
    const b = await createProduct({ unitPrice: 500 });
    const { orderItems: base, subtotal, totalDiscount } = await buildOrderItems([
      { productId: String(a._id), quantity: 2 },
      { productId: String(b._id), quantity: 1 },
    ]);
    const order = { items: base, subtotal, totalDiscount, total: subtotal - totalDiscount };

    const { orderItems, changes } = await rebuildOrderItems(order, [
      { productId: String(a._id), quantity: 2 },
      { productId: String(b._id), quantity: 0 },
    ]);

    expect(orderItems).toHaveLength(1);
    expect(changes).toContainEqual(expect.objectContaining({ kind: 'removed' }));
  });

  it('deja el pedido vacío cuando se quitan todas las líneas (el controller lo traduce a cancelar)', async () => {
    const product = await createProduct({ unitPrice: 1000 });
    const order = await makeOrder(String(product._id), 2);

    const { orderItems } = await rebuildOrderItems(order, [
      { productId: String(product._id), quantity: 0 },
    ]);

    expect(orderItems).toHaveLength(0);
  });

  it('registra el cambio de cantidad de una línea existente', async () => {
    const product = await createProduct({ unitPrice: 1000 });
    const order = await makeOrder(String(product._id), 2);

    const { changes } = await rebuildOrderItems(order, [
      { productId: String(product._id), quantity: 7 },
    ]);

    expect(changes).toContainEqual(
      expect.objectContaining({ kind: 'quantity', before: 2, after: 7 })
    );
  });

  it('rechaza la misma presentación repetida en dos líneas', async () => {
    const product = await createProduct({ unitPrice: 1000 });
    const order = await makeOrder(String(product._id), 1);

    await expect(
      rebuildOrderItems(order, [
        { productId: String(product._id), quantity: 1 },
        { productId: String(product._id), quantity: 3 },
      ])
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('rebuildOrderItems — identidad de línea por presentación', () => {
  let categoryId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const category = await Category.create({
      name: `Cat ${Date.now()}-${Math.random()}`,
      slug: `cat-${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
      level: 0,
    });
    categoryId = category._id as mongoose.Types.ObjectId;
  });

  it('el mismo producto en dos presentaciones son dos líneas distintas', async () => {
    // Sin esto, agregar un display a un pedido que ya tiene unidades le sumaba
    // cantidad a la unidad y el display nunca llegaba.
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const product = await Product.create({
      name: `Multi ${suffix}`,
      slug: `multi-${suffix}`,
      description: 'Producto con dos presentaciones para el test.',
      categories: [categoryId],
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      presentaciones: [
        { type: 'unidad', quantity: 1, unitPrice: 1000, tiers: [], principal: true },
        { type: 'display', quantity: 6, unitPrice: 5400, tiers: [] },
      ],
      active: true,
    });

    const unidad = product.presentaciones![0];
    const display = product.presentaciones![1];

    const order = await buildOrderItems([
      { productId: String(product._id), presentationId: String(unidad._id), quantity: 2 },
    ]).then(({ orderItems, subtotal, totalDiscount }) => ({
      items: orderItems,
      subtotal,
      totalDiscount,
      total: subtotal - totalDiscount,
    }));

    const { orderItems } = await rebuildOrderItems(order, [
      { productId: String(product._id), presentationId: String(unidad._id), quantity: 2 },
      { productId: String(product._id), presentationId: String(display._id), quantity: 1 },
    ]);

    expect(orderItems).toHaveLength(2);
    expect(orderItems[0].quantity).toBe(2);
    expect(orderItems[1].pricePerUnit).toBe(5400);
  });
});
