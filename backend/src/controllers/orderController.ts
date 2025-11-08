import { Response } from 'express';
import { Order, IOrder, User } from '../models';
import ProductVariant from '../models/ProductVariant';
import ProductParent from '../models/ProductParent';
import { AuthRequest, ApiResponse, PaginatedResponse, OrderStatus } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { applyDiscountToCart } from '../services/discountService';
import { generateWhatsAppURL, generateConfirmationMessage, generateReadyForDeliveryMessage, generateCancellationMessage } from '../services/whatsappService';

/**
 * Controller para Order - Integra stock + whatsapp + discounts + addresses
 */

// @desc    Crear orden (con descuentos automáticos + deducción de stock + direcciones)
// @route   POST /api/orders
// @access  Public (visita) / Private (cliente, funcionario, admin)
export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const {
      items,
      deliveryMethod,
      paymentMethod,
      useAddressId,
      deliveryNotes,
      customerNotes,
    } = req.body;

    // Obtener información del usuario (si está autenticado)
    let customerData: any = {};
    let addressData: any = undefined;

    if (req.user) {
      // Usuario autenticado
      const user = await User.findById(req.user.id).select('name email phone addresses');

      if (!user) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      customerData = {
        user: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      };

      // Si proporcionó un useAddressId, usar esa dirección
      if (useAddressId) {
        const selectedAddress = user.addresses.find(
          (addr) => addr._id.toString() === useAddressId
        );

        if (!selectedAddress) {
          throw new AppError(404, 'Dirección no encontrada');
        }

        addressData = {
          street: selectedAddress.street,
          number: selectedAddress.number,
          city: selectedAddress.city,
          neighborhood: selectedAddress.neighborhood,
          reference: selectedAddress.reference,
        };
      } else {
        // No proporcionó dirección - usar la predeterminada si existe
        const defaultAddress = user.addresses.find((addr) => addr.isDefault);

        if (defaultAddress) {
          addressData = {
            street: defaultAddress.street,
            number: defaultAddress.number,
            city: defaultAddress.city,
            neighborhood: defaultAddress.neighborhood,
            reference: defaultAddress.reference,
          };
        }
        // Si no hay dirección predeterminada, addressData queda undefined
        // El funcionario preguntará por WhatsApp
      }
    } else {
      // Usuario no autenticado (visita) - debe proporcionar datos en el body
      const { customer } = req.body;

      if (!customer || !customer.name || !customer.email || !customer.phone) {
        throw new AppError(
          400,
          'Usuario no autenticado debe proporcionar: customer.name, customer.email, customer.phone'
        );
      }

      customerData = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      };

      // Dirección opcional para visitas
      if (customer.address) {
        addressData = customer.address;
      }
    }

    // Validar método de entrega
    if (deliveryMethod === 'delivery' && !addressData && !deliveryNotes) {
      // Advertencia: no hay dirección pero es delivery
      // No fallar, el funcionario puede manejar esto por WhatsApp
      console.warn(
        `Orden con delivery pero sin dirección. OrderNumber se generará después. Cliente: ${customerData.email}`
      );
    }

    // Preparar items con descuentos aplicados
    const cartItems = items.map((item: any) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    // Aplicar descuentos automáticamente
    const itemsWithDiscounts = await applyDiscountToCart(cartItems);

    // Construir items de la orden con snapshots
    const orderItems = await Promise.all(
      itemsWithDiscounts.map(async (item) => {
        const variant = await ProductVariant.findById(item.variantId).populate(
          'parentProduct',
          'name'
        );

        if (!variant) {
          throw new AppError(404, `Variante ${item.variantId} no encontrada`);
        }

        // Crear snapshot de la variante
        return {
          variant: variant._id,
          variantSnapshot: {
            sku: variant.sku,
            name: variant.name,
            price: item.originalPrice,
            attributes: variant.attributes as any,
            image: variant.images[0] || '',
          },
          quantity: item.quantity,
          pricePerUnit: item.finalPricePerUnit,
          discount: item.totalDiscount,
          subtotal: item.subtotal,
        };
      })
    );

    // Calcular totales (shippingCost se agregará después en confirmOrder)
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = orderItems.reduce((sum, item) => sum + item.discount, 0);
    const shippingCost = 0; // Se calcula manualmente por el funcionario
    const total = subtotal + shippingCost;

    // Crear la orden (el pre-save hook deducirá el stock automáticamente)
    const order = await Order.create({
      customer: {
        ...customerData,
        address: addressData, // Puede ser undefined
      },
      items: orderItems,
      subtotal,
      totalDiscount,
      shippingCost,
      total,
      deliveryMethod,
      paymentMethod,
      deliveryNotes,
      customerNotes,
      status: 'pending_whatsapp',
      whatsappSent: false,
    });

    // Generar URL de WhatsApp
    const whatsappURL = generateWhatsAppURL(order, process.env.WHATSAPP_BUSINESS_PHONE || '595981234567');

    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        order,
        whatsappURL,
      },
    });
  }
);

// @desc    Confirmar orden y establecer costo de envío (funcionario)
// @route   PUT /api/orders/:id/confirm
// @access  Private (admin, funcionario)
export const confirmOrder = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { shippingCost, adminNotes } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

    if (order.status !== 'pending_whatsapp') {
      throw new AppError(400, 'Solo se pueden confirmar órdenes en estado pending_whatsapp');
    }

    // Actualizar orden con costo de envío
    order.shippingCost = shippingCost;
    order.total = order.subtotal + shippingCost;
    order.status = 'confirmed';
    order.confirmedAt = new Date();

    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    await order.save();

    // Generar mensaje de confirmación
    const message = generateConfirmationMessage(order);

    res.status(200).json({
      success: true,
      message: 'Orden confirmada exitosamente',
      data: {
        order,
        whatsappMessage: message,
      },
    });
  }
);

// @desc    Obtener todas las órdenes con filtros y paginación
// @route   GET /api/orders
// @access  Private (admin, funcionario)
export const getOrders = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<IOrder>>>) => {
    const {
      status,
      page = '1',
      limit = '20',
      email,
      orderNumber,
      startDate,
      endDate,
    } = req.query as any;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (email) {
      query['customer.email'] = { $regex: email, $options: 'i' };
    }

    if (orderNumber) {
      query.orderNumber = { $regex: orderNumber, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('customer.user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        data: orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  }
);

// @desc    Obtener orden por ID
// @route   GET /api/orders/:id
// @access  Private (admin, funcionario) o Public (owner)
export const getOrderById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;

    const order = await Order.findById(id).populate('customer.user', 'name email');

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

    // Si no es admin/funcionario, verificar que sea el dueño
    if (req.user) {
      const isOwner = order.customer.user?.toString() === req.user.id;
      const isAdminOrFuncionario = ['admin', 'funcionario'].includes(req.user.role);

      if (!isOwner && !isAdminOrFuncionario) {
        throw new AppError(403, 'No tienes permisos para ver esta orden');
      }
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  }
);

// @desc    Obtener orden por número de orden
// @route   GET /api/orders/number/:orderNumber
// @access  Public
export const getOrderByNumber = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber }).populate(
      'customer.user',
      'name email'
    );

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  }
);

// @desc    Obtener mis órdenes (cliente autenticado)
// @route   GET /api/orders/my-orders
// @access  Private (cliente)
export const getMyOrders = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Usuario no autenticado');
    }

    const { page = '1', limit = '10' } = req.query as any;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find({ 'customer.user': userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments({ 'customer.user': userId });

    res.status(200).json({
      success: true,
      data: {
        data: orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  }
);

// @desc    Actualizar estado de orden
// @route   PUT /api/orders/:id/status
// @access  Private (admin, funcionario)
export const updateOrderStatus = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { status, adminNotes } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

    // Prevenir cambiar de cancelled a otro estado
    if (order.status === 'cancelled' && status !== 'cancelled') {
      throw new AppError(400, 'No se puede cambiar el estado de una orden cancelada');
    }

    order.status = status;
    if (adminNotes) order.adminNotes = adminNotes;

    await order.save();

    // Generar mensaje de WhatsApp según el nuevo estado
    let message = '';
    if (status === 'confirmed') {
      message = generateConfirmationMessage(order);
    } else if (status === 'shipped' || status === 'preparing') {
      message = generateReadyForDeliveryMessage(order);
    }

    res.status(200).json({
      success: true,
      message: 'Estado de orden actualizado exitosamente',
      data: {
        order,
        whatsappMessage: message,
      },
    });
  }
);

// @desc    Cancelar orden (restaura stock automáticamente)
// @route   PUT /api/orders/:id/cancel
// @access  Private (admin, funcionario, owner)
export const cancelOrder = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { reason } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

    // Verificar permisos
    if (req.user) {
      const isOwner = order.customer.user?.toString() === req.user.id;
      const isAdminOrFuncionario = ['admin', 'funcionario'].includes(req.user.role);

      if (!isOwner && !isAdminOrFuncionario) {
        throw new AppError(403, 'No tienes permisos para cancelar esta orden');
      }
    } else {
      throw new AppError(401, 'Usuario no autenticado');
    }

    // No permitir cancelar orden ya completada
    if (order.status === 'completed') {
      throw new AppError(400, 'No se puede cancelar una orden completada');
    }

    // No permitir cancelar orden ya cancelada
    if (order.status === 'cancelled') {
      throw new AppError(400, 'La orden ya está cancelada');
    }

    order.status = 'cancelled';
    order.cancelledBy = req.user?.id as any;
    order.cancellationReason = reason;

    // El pre-save hook restaurará el stock automáticamente
    await order.save();

    // Generar mensaje de cancelación
    const message = generateCancellationMessage(order);

    res.status(200).json({
      success: true,
      message: 'Orden cancelada exitosamente',
      data: {
        order,
        whatsappMessage: message,
      },
    });
  }
);

// @desc    Marcar WhatsApp como enviado
// @route   PUT /api/orders/:id/whatsapp-sent
// @access  Private (admin, funcionario)
export const markWhatsAppSent = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const { messageId } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

    order.whatsappSent = true;
    order.whatsappSentAt = new Date();

    if (messageId) {
      order.whatsappMessageId = messageId;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'WhatsApp marcado como enviado',
      data: { order },
    });
  }
);

// @desc    Obtener estadísticas de órdenes
// @route   GET /api/orders/stats
// @access  Private (admin, funcionario)
export const getOrderStats = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { startDate, endDate } = req.query as any;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await Order.getStats(start, end);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  }
);
