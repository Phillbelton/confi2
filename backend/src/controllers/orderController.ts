import { Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import Product, { ITier, IFixedDiscount } from '../models/Product';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import logger from '../config/logger';

export interface CartItemInput {
  productId: string;
  /** Presentación elegida (subdoc `_id`). Si falta, se usa la principal. */
  presentationId?: string;
  quantity: number;
}

/**
 * Tipo mínimo que `effectiveUnitPrice` necesita de un producto.
 * Aceptamos cualquier objeto que tenga `unitPrice` y opcionalmente `tiers`
 * para poder usar tanto documentos Mongoose hidratados como `.lean()`.
 */
export interface PriceableProduct {
  unitPrice: number;
  tiers?: Pick<ITier, 'minQuantity' | 'pricePerUnit'>[];
  fixedDiscount?: Partial<
    Pick<IFixedDiscount, 'enabled' | 'type' | 'value' | 'startDate' | 'endDate'>
  > | null;
}

/**
 * ¿La oferta fija (`fixedDiscount`) está vigente en `now`? Requiere
 * `enabled`, un `type` válido y `value` numérico, y que `now` caiga dentro
 * del rango [startDate, endDate] cuando esos límites estén definidos.
 *
 * Se evalúa acá (y no vía el virtual `hasActiveDiscount` del modelo) porque
 * `buildOrderItems` lee con `.lean()`, que no incluye virtuals.
 */
function isFixedDiscountActive(
  fd: PriceableProduct['fixedDiscount'],
  now: Date
): fd is NonNullable<PriceableProduct['fixedDiscount']> & {
  type: 'percentage' | 'amount';
  value: number;
} {
  if (
    !fd?.enabled ||
    (fd.type !== 'percentage' && fd.type !== 'amount') ||
    typeof fd.value !== 'number'
  ) {
    return false;
  }
  const t = now.getTime();
  const start = fd.startDate ? new Date(fd.startDate).getTime() : null;
  const end = fd.endDate ? new Date(fd.endDate).getTime() : null;
  if (start !== null && t < start) return false;
  if (end !== null && t > end) return false;
  return true;
}

/**
 * Precio base por presentación tras aplicar la oferta fija vigente.
 *
 * SEMÁNTICA (decisión de negocio 2026-06-16): `fixedDiscount` NO es solo un
 * badge — anuncia un *cambio de precio real*. El valor con descuento pasa a
 * ser el nuevo precio efectivo para cantidades por debajo de cualquier tramo.
 * Los `tiers` (precio por volumen) siguen aplicando aparte al alcanzar su
 * `minQuantity`. Mantener en sync con `frontend/lib/discountCalculator.ts`.
 */
export function discountedUnitPrice(
  product: PriceableProduct,
  now: Date = new Date()
): number {
  const base = product.unitPrice;
  const fd = product.fixedDiscount;
  if (!isFixedDiscountActive(fd, now)) return base;
  const next =
    fd.type === 'percentage' ? base * (1 - fd.value / 100) : base - fd.value;
  // CLP no tiene decimales: redondeamos para que el precio cobrado coincida
  // exactamente con el mostrado (el front también redondea).
  return Math.max(0, Math.round(next));
}

/**
 * Precio efectivo por unidad para una cantidad dada.
 *
 *   1. Parte del precio base (`unitPrice` con la oferta fija ya aplicada).
 *   2. Si la cantidad alcanza un tramo, usa ese precio mayorista. Cuando hay
 *      una oferta fija vigente que bajó el precio, el cliente nunca paga más
 *      que ese precio anunciado (`Math.min`). Sin oferta, el tramo es
 *      autoritativo aunque haya quedado por encima de `unitPrice` por una mala
 *      configuración (comportamiento histórico, no lo cambiamos acá).
 *
 * Exportado para permitir tests unitarios sobre la matemática del precio.
 */
export function effectiveUnitPrice(
  product: PriceableProduct,
  quantity: number,
  now: Date = new Date()
): number {
  const base = discountedUnitPrice(product, now);
  const fixedLoweredPrice = base < product.unitPrice;
  const tiers = product.tiers || [];
  const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  for (const t of sorted) {
    if (quantity >= t.minQuantity) {
      return fixedLoweredPrice ? Math.min(t.pricePerUnit, base) : t.pricePerUnit;
    }
  }
  return base;
}

/**
 * Resuelve la presentación efectiva de un producto para una línea de carrito:
 * la elegida (por `_id`), o la principal, o —productos aún sin migrar— un
 * fallback armado desde los campos legacy. El resultado siempre tiene
 * `{ unitPrice, tiers, fixedDiscount }` (es un `PriceableProduct`) más
 * `{ type, quantity }` para el snapshot.
 */
function resolvePresentation(
  product: any,
  presentationId?: string
): PriceableProduct & { type?: string; quantity?: number; _id?: mongoose.Types.ObjectId } {
  const list: any[] = Array.isArray(product.presentaciones) ? product.presentaciones : [];
  const pres =
    (presentationId && list.find((p) => p?._id?.toString() === presentationId)) ||
    list.find((p) => p?.principal) ||
    list[0];
  if (pres) return pres;
  return {
    unitPrice: product.unitPrice,
    tiers: product.tiers,
    fixedDiscount: product.fixedDiscount,
    type: product.saleUnit?.type,
    quantity: product.saleUnit?.quantity,
  };
}

export async function buildOrderItems(items: CartItemInput[]) {
  const orderItems: any[] = [];
  let subtotal = 0;
  let totalDiscount = 0;
  // Un único `now` para toda la orden: que la vigencia de la oferta fija no
  // varíe entre items por el paso del tiempo dentro del mismo cálculo.
  const now = new Date();
  for (const it of items) {
    if (!mongoose.Types.ObjectId.isValid(it.productId)) {
      throw new AppError(400, `productId inválido: ${it.productId}`);
    }
    const product = await Product.findById(it.productId).lean();
    if (!product || !product.active) {
      throw new AppError(404, `Producto ${it.productId} no disponible`);
    }
    const pres = resolvePresentation(product, it.presentationId);
    const ppu = effectiveUnitPrice(pres, it.quantity, now);
    const lineSubtotal = ppu * it.quantity;
    const discount = Math.max(0, (pres.unitPrice - ppu) * it.quantity);
    orderItems.push({
      product: product._id,
      presentationId: pres._id,
      productSnapshot: {
        name: product.name,
        slug: product.slug,
        barcode: product.barcode,
        unitPrice: pres.unitPrice,
        saleUnit: { type: pres.type, quantity: pres.quantity },
        image: product.images?.[0] || '',
        // Se congela la escalera para poder reeditar el pedido más adelante
        // respetando lo que el cliente pactó. Ver IOrderItem.
        tiers: (pres.tiers || []).map((t) => ({
          minQuantity: t.minQuantity,
          pricePerUnit: t.pricePerUnit,
        })),
        fixedDiscount: pres.fixedDiscount ?? undefined,
      },
      quantity: it.quantity,
      pricePerUnit: ppu,
      discount,
      subtotal: lineSubtotal,
    });
    subtotal += pres.unitPrice * it.quantity;
    totalDiscount += discount;
  }
  return { orderItems, subtotal, totalDiscount };
}

// ─── Edición de pedidos ──────────────────────────────────────────────────────

/** Identidad de una línea: el mismo producto puede estar dos veces si se
 *  compró por unidad y por display. */
const lineKey = (productId: unknown, presentationId?: unknown): string =>
  `${String(productId)}__${presentationId ? String(presentationId) : 'principal'}`;

export interface EditLineInput extends CartItemInput {
  /** 0 = eliminar la línea. */
  quantity: number;
}

export interface OrderEditChange {
  name: string;
  /** 'added' | 'removed' | 'quantity' | 'price' */
  kind: 'added' | 'removed' | 'quantity' | 'price';
  before?: number;
  after?: number;
}

/**
 * Recalcula los items de un pedido que ya existe.
 *
 * Regla de precios (decidida con el negocio): las líneas que YA estaban en el
 * pedido conservan la escalera congelada al comprar, así que si el catálogo
 * subió el cliente no paga la diferencia; pero si hoy está más barato se le
 * pasa la rebaja (nunca se cobra por encima de lo pactado NI del precio
 * actual). Las líneas nuevas se cotizan al precio de hoy.
 *
 * Congelar la escalera —y no el precio final— es lo que permite que, al subir
 * la cantidad, el cliente siga accediendo a sus tramos por volumen.
 *
 * Como las líneas preexistentes no necesitan consultar el catálogo, un pedido
 * con productos discontinuados se puede seguir editando.
 */
export async function rebuildOrderItems(
  order: { items: any[] },
  items: EditLineInput[]
) {
  const now = new Date();
  // Se indexa por clave exacta y además por producto: el llamador puede no
  // mandar `presentationId` (pedidos viejos, o simplemente "la principal"),
  // y aun así esa línea ya existe y debe conservar su precio pactado.
  const previous = new Map<string, any>();
  const previousByProduct = new Map<string, any[]>();
  for (const item of order.items) {
    previous.set(lineKey(item.product, item.presentationId), item);
    const pid = String(item.product);
    previousByProduct.set(pid, [...(previousByProduct.get(pid) ?? []), item]);
  }

  const orderItems: any[] = [];
  const changes: OrderEditChange[] = [];
  let subtotal = 0;
  let totalDiscount = 0;
  const seen = new Set<string>();
  /** Claves de líneas previas ya reutilizadas (para saber cuáles se quitaron). */
  const consumed = new Set<string>();

  for (const it of items) {
    if (!mongoose.Types.ObjectId.isValid(it.productId)) {
      throw new AppError(400, `productId inválido: ${it.productId}`);
    }
    // Cantidad 0 = quitar la línea (el pedido se queda sin ella y punto).
    if (it.quantity <= 0) continue;

    const key = lineKey(it.productId, it.presentationId);
    if (seen.has(key)) {
      throw new AppError(400, 'La misma presentación aparece dos veces en el pedido');
    }
    seen.add(key);

    let prev = previous.get(key);
    if (!prev && !it.presentationId) {
      prev = (previousByProduct.get(String(it.productId)) ?? []).find(
        (c) => !consumed.has(lineKey(c.product, c.presentationId))
      );
    }
    if (prev) consumed.add(lineKey(prev.product, prev.presentationId));

    if (prev) {
      // ── Línea preexistente: manda la escalera congelada ──
      const snap = prev.productSnapshot ?? {};
      const frozen: PriceableProduct = {
        unitPrice: snap.unitPrice,
        tiers: snap.tiers ?? [],
        fixedDiscount: snap.fixedDiscount ?? undefined,
      };
      let ppu = effectiveUnitPrice(frozen, it.quantity, now);

      // Si hoy está más barato, se le pasa la rebaja.
      const product = await Product.findById(it.productId).lean();
      if (product) {
        const pres = resolvePresentation(product, it.presentationId);
        const todayPpu = effectiveUnitPrice(pres, it.quantity, now);
        ppu = Math.min(ppu, todayPpu);
      }

      const base = Math.max(snap.unitPrice ?? ppu, ppu);
      const lineSubtotal = ppu * it.quantity;
      orderItems.push({
        ...prev,
        quantity: it.quantity,
        pricePerUnit: ppu,
        discount: Math.max(0, (base - ppu) * it.quantity),
        subtotal: lineSubtotal,
      });
      subtotal += base * it.quantity;
      totalDiscount += Math.max(0, (base - ppu) * it.quantity);

      if (prev.quantity !== it.quantity) {
        changes.push({
          name: snap.name,
          kind: 'quantity',
          before: prev.quantity,
          after: it.quantity,
        });
      }
      if (prev.pricePerUnit !== ppu) {
        changes.push({
          name: snap.name,
          kind: 'price',
          before: prev.pricePerUnit,
          after: ppu,
        });
      }
    } else {
      // ── Línea nueva: precio de hoy ──
      const built = await buildOrderItems([it]);
      const line = built.orderItems[0];
      orderItems.push(line);
      subtotal += built.subtotal;
      totalDiscount += built.totalDiscount;
      changes.push({
        name: line.productSnapshot.name,
        kind: 'added',
        after: it.quantity,
      });
    }
  }

  for (const [key, item] of previous) {
    if (!consumed.has(key)) {
      changes.push({
        name: item.productSnapshot?.name ?? 'Producto',
        kind: 'removed',
        before: item.quantity,
      });
    }
  }

  return { orderItems, subtotal, totalDiscount, changes };
}

/**
 * Política de acceso a una orden individual:
 *   - admin/funcionario: siempre pueden ver.
 *   - cliente: solo si la orden tiene `customer.user` que matchea su id.
 *   - guest (sin user): nadie excepto admin/funcionario puede leer/cancelar.
 *
 * Se usa en GET /:id, GET /number/:orderNumber y PUT /:id/cancel para
 * impedir IDOR (acceder por id directo a órdenes ajenas).
 */
const canAccessOrder = (
  order: { customer?: { user?: mongoose.Types.ObjectId | string | null } },
  user: { id: string; role: string } | undefined
): boolean => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'funcionario') return true;
  const ownerId = order.customer?.user?.toString();
  return !!ownerId && ownerId === user.id;
};

export const validateCart = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items } = req.body as { items: CartItemInput[] };
    if (!items?.length) throw new AppError(400, 'Items requeridos');
    const { orderItems, subtotal, totalDiscount } = await buildOrderItems(items);
    res.status(200).json({
      success: true,
      data: { items: orderItems, subtotal, totalDiscount, total: subtotal - totalDiscount },
    });
  }
);

export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items, customer, deliveryMethod, paymentMethod, shippingCost = 0, customerNotes, deliveryNotes } = req.body;
    if (!items?.length) throw new AppError(400, 'Items requeridos');
    if (!customer?.name || !customer?.phone) throw new AppError(400, 'Datos del cliente incompletos');
    const { orderItems, subtotal, totalDiscount } = await buildOrderItems(items);
    const total = subtotal - totalDiscount + shippingCost;
    const order = await Order.create({
      customer: { ...customer, user: req.user?.id },
      items: orderItems,
      subtotal,
      totalDiscount,
      shippingCost,
      total,
      deliveryMethod,
      paymentMethod,
      status: 'pending_whatsapp',
      whatsappSent: false,
      customerNotes,
      deliveryNotes,
      createdBy: req.user?.id,
    });

    // Email de "pedido recibido" (fire-and-forget). Ver notifyCustomer.
    notifyCustomer(
      order,
      (email, name) => emailService.sendOrderReceivedEmail(order, email, name),
      'pedido recibido'
    );

    res.status(201).json({ success: true, message: 'Orden creada', data: { order } });
  }
);

export const getOrders = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;
    const filter: any = {};
    if (status) filter.status = status;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const [data, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Order.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true,
      data: { data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 } },
    });
  }
);

export const getOrderById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw new AppError(404, 'Orden no encontrada');
    if (!canAccessOrder(order, req.user)) {
      // 404 (no 403) para no filtrar la existencia de la orden.
      throw new AppError(404, 'Orden no encontrada');
    }
    res.status(200).json({ success: true, data: { order } });
  }
);

export const getOrderByNumber = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).lean();
    if (!order) throw new AppError(404, 'Orden no encontrada');
    if (!canAccessOrder(order, req.user)) {
      throw new AppError(404, 'Orden no encontrada');
    }
    res.status(200).json({ success: true, data: { order } });
  }
);

export const getMyOrders = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    if (!req.user?.id) throw new AppError(401, 'No autenticado');
    const orders = await Order.find({ 'customer.user': req.user.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: { orders } });
  }
);

export const updateOrderStatus = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, 'Orden no encontrada');
    const previousStatus = order.status;
    order.status = status;
    if (req.user?.id) order.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    await order.save();

    // Aviso al cliente solo en los hitos que le importan (listo/en camino,
    // completado) y solo si el estado realmente cambió a uno de ellos.
    if (status !== previousStatus && STATUS_EMAIL.has(status)) {
      notifyCustomer(
        order,
        (email, name) => emailService.sendOrderStatusUpdateEmail(order, email, name, status),
        `cambio de estado (${status})`
      );
    }

    res.status(200).json({ success: true, data: { order } });
  }
);

export const confirmOrder = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, 'Orden no encontrada');
    order.status = 'confirmed';
    await order.save();
    res.status(200).json({ success: true, data: { order } });
  }
);

export const cancelOrder = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    // El schema Zod (cancelOrderSchema) ya valida que cancellationReason
    // esté presente y tenga ≥10 chars; acá solo lo leemos.
    const { cancellationReason } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, 'Orden no encontrada');
    if (!canAccessOrder(order, req.user)) {
      // 404 para no filtrar existencia. Un cliente intentando cancelar
      // una orden ajena recibe el mismo error que si no existiera.
      throw new AppError(404, 'Orden no encontrada');
    }
    const wasAlreadyCancelled = order.status === 'cancelled';
    order.status = 'cancelled';
    order.cancellationReason = cancellationReason;
    order.cancelledAt = new Date();
    if (req.user?.id) order.cancelledBy = new mongoose.Types.ObjectId(req.user.id);
    await order.save();

    // Cancelar es definitivo: se avisa al cliente (salvo que ya estuviera
    // cancelada, para no mandar el mail dos veces).
    if (!wasAlreadyCancelled) {
      notifyCustomer(
        order,
        (email, name) => emailService.sendOrderCancellationEmail(order, email, name),
        'cancelación'
      );
    }

    res.status(200).json({ success: true, data: { order } });
  }
);

export const markWhatsAppSent = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, 'Orden no encontrada');
    order.whatsappSent = true;
    order.whatsappSentAt = new Date();
    await order.save();
    res.status(200).json({ success: true, data: { order } });
  }
);

export const getOrderStats = asyncHandler(
  async (_req: AuthRequest, res: Response<ApiResponse>) => {
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ]);
    res.status(200).json({ success: true, data: { stats } });
  }
);

/** Estados en los que todavía tiene sentido tocar los productos del pedido. */
const EDITABLE_STATUSES = ['pending_whatsapp', 'confirmed', 'preparing'];

/**
 * Dispara un email al cliente sin bloquear la respuesta ni hacerla fallar.
 * Solo si el cliente dejó email (es opcional para invitados) y si SMTP anda.
 * El negocio se comunica sobre todo por WhatsApp; el email es un respaldo.
 */
function notifyCustomer(
  order: any,
  send: (email: string, name: string) => Promise<boolean>,
  label: string
): void {
  if (!order.customer?.email) return;
  send(order.customer.email, order.customer.name).catch((err) =>
    logger.error(`No se pudo enviar el email de ${label}`, {
      orderNumber: order.orderNumber,
      error: err instanceof Error ? err.message : String(err),
    })
  );
}

/** Cambios de estado que ameritan avisarle al cliente (los demás son internos). */
const STATUS_EMAIL = new Set(['shipped', 'completed']);

/** Avisos que el operador tiene que ver ANTES de guardar (no bloquean). */
function editWarnings(order: any, nextTotal: number): string[] {
  const warnings: string[] = [];
  if (order.total !== nextTotal) {
    if (order.paymentProof) {
      warnings.push(
        'El cliente ya envió el comprobante de pago: el monto que transfirió no coincidirá con el nuevo total.'
      );
    }
    if (order.whatsappSent) {
      warnings.push(
        'Ya se le envió el pedido por WhatsApp: tiene un total distinto al que queda ahora.'
      );
    }
    if (order.shippingCost > 0) {
      warnings.push('Revisa el costo de envío: no se recalcula solo al cambiar los productos.');
    }
  }
  return warnings;
}

/**
 * Previsualiza una edición: devuelve cómo quedaría el pedido y qué cambia,
 * SIN guardar nada. Existe para que el panel muestre el impacto en plata
 * usando el cálculo real del servidor, en lugar de reimplementar los precios.
 */
export const previewOrderItems = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items } = req.body as { items: EditLineInput[] };
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw new AppError(404, 'Orden no encontrada');

    const { orderItems, subtotal, totalDiscount, changes } = await rebuildOrderItems(
      order as any,
      items
    );
    const total = subtotal - totalDiscount + (order.shippingCost || 0);

    res.status(200).json({
      success: true,
      data: {
        items: orderItems,
        subtotal,
        totalDiscount,
        shippingCost: order.shippingCost || 0,
        total,
        // Lo que el operador necesita para decidir
        previousTotal: order.total,
        difference: total - order.total,
        changes,
        isEmpty: orderItems.length === 0,
        warnings: editWarnings(order, total),
      },
    });
  }
);

export const editOrderItems = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items, adminNotes } = req.body as {
      items: EditLineInput[];
      adminNotes?: string;
    };
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, 'Orden no encontrada');

    if (!EDITABLE_STATUSES.includes(order.status)) {
      throw new AppError(
        400,
        'Este pedido ya no se puede editar: solo se pueden modificar los pendientes, confirmados o en preparación.'
      );
    }

    const { orderItems, subtotal, totalDiscount, changes } = await rebuildOrderItems(
      order,
      items
    );

    // Quedarse sin productos no es una edición válida: lo que se quiso hacer
    // fue cancelar. Se responde con esa intención en vez de un error seco.
    if (orderItems.length === 0) {
      throw new AppError(
        400,
        'El pedido quedaría sin productos. Si querías anularlo, cancela el pedido.'
      );
    }

    const previousTotal = order.total;
    order.items = orderItems;
    order.subtotal = subtotal;
    order.totalDiscount = totalDiscount;
    order.total = subtotal - totalDiscount + (order.shippingCost || 0);
    if (adminNotes) order.adminNotes = adminNotes;

    // El cliente tiene en su teléfono un total que ya no corresponde: el pedido
    // vuelve a quedar "sin comunicar" para que alguien le reescriba.
    if (order.whatsappSent && order.total !== previousTotal) {
      order.whatsappSent = false;
    }

    if (req.user?.id) order.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    await order.save();

    if (changes.length > 0) {
      notifyCustomer(
        order,
        (email, name) => emailService.sendOrderEditedEmail(order, email, name),
        'pedido editado'
      );
    }

    logger.info('Pedido editado', {
      orderId: order._id.toString(),
      by: req.user?.id,
      changes,
      previousTotal,
      newTotal: order.total,
    });

    res.status(200).json({
      success: true,
      data: { order, changes, previousTotal, difference: order.total - previousTotal },
    });
  }
);

export const updateShippingCost = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { shippingCost } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, 'Orden no encontrada');
    order.shippingCost = shippingCost;
    order.total = order.subtotal - order.totalDiscount + shippingCost;
    await order.save();
    res.status(200).json({ success: true, data: { order } });
  }
);
