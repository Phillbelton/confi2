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
): PriceableProduct & { type?: string; quantity?: number } {
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
      productSnapshot: {
        name: product.name,
        slug: product.slug,
        barcode: product.barcode,
        unitPrice: pres.unitPrice,
        saleUnit: { type: pres.type, quantity: pres.quantity },
        image: product.images?.[0] || '',
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

    // Email de "pedido recibido" (fire-and-forget). Solo si el cliente dejó
    // email — es opcional en el checkout. No bloquea ni hace fallar la creación
    // de la orden si el envío falla (o si SMTP no está configurado).
    if (order.customer.email) {
      emailService
        .sendOrderReceivedEmail(order, order.customer.email, order.customer.name)
        .catch((err) =>
          logger.error('No se pudo enviar el email de pedido recibido', {
            err,
            orderNumber: order.orderNumber,
          })
        );
    }

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
    order.status = status;
    if (req.user?.id) order.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    await order.save();
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
    order.status = 'cancelled';
    order.cancellationReason = cancellationReason;
    order.cancelledAt = new Date();
    if (req.user?.id) order.cancelledBy = new mongoose.Types.ObjectId(req.user.id);
    await order.save();
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

export const editOrderItems = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items } = req.body as { items: CartItemInput[] };
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, 'Orden no encontrada');
    const { orderItems, subtotal, totalDiscount } = await buildOrderItems(items);
    order.items = orderItems;
    order.subtotal = subtotal;
    order.totalDiscount = totalDiscount;
    order.total = subtotal - totalDiscount + (order.shippingCost || 0);
    if (req.user?.id) order.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    await order.save();
    res.status(200).json({ success: true, data: { order } });
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
