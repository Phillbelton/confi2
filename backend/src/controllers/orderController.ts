import { Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import Product from '../models/Product';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

interface CartItemInput {
  productId: string;
  quantity: number;
}

function effectiveUnitPrice(product: any, quantity: number): number {
  const tiers = (product.tiers || []) as Array<{ minQuantity: number; pricePerUnit: number }>;
  const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  for (const t of sorted) if (quantity >= t.minQuantity) return t.pricePerUnit;
  return product.unitPrice;
}

async function buildOrderItems(items: CartItemInput[]) {
  const orderItems: any[] = [];
  let subtotal = 0;
  let totalDiscount = 0;
  for (const it of items) {
    if (!mongoose.Types.ObjectId.isValid(it.productId)) {
      throw new AppError(400, `productId inválido: ${it.productId}`);
    }
    const product = await Product.findById(it.productId).lean();
    if (!product || !product.active) {
      throw new AppError(404, `Producto ${it.productId} no disponible`);
    }
    const ppu = effectiveUnitPrice(product, it.quantity);
    const lineSubtotal = ppu * it.quantity;
    const discount = Math.max(0, (product.unitPrice - ppu) * it.quantity);
    orderItems.push({
      product: product._id,
      productSnapshot: {
        name: product.name,
        slug: product.slug,
        barcode: product.barcode,
        unitPrice: product.unitPrice,
        saleUnit: product.saleUnit,
        image: product.images?.[0] || '',
      },
      quantity: it.quantity,
      pricePerUnit: ppu,
      discount,
      subtotal: lineSubtotal,
    });
    subtotal += product.unitPrice * it.quantity;
    totalDiscount += discount;
  }
  return { orderItems, subtotal, totalDiscount };
}

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
    res.status(200).json({ success: true, data: { order } });
  }
);

export const getOrderByNumber = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).lean();
    if (!order) throw new AppError(404, 'Orden no encontrada');
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
    const { reason } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, 'Orden no encontrada');
    order.status = 'cancelled';
    order.cancellationReason = reason;
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
