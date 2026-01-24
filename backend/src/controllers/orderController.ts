import { Response } from 'express';
import { Order, IOrder, User } from '../models';
import ProductVariant from '../models/ProductVariant';
import ProductParent from '../models/ProductParent';
import StockMovement from '../models/StockMovement';
import { AuthRequest, ApiResponse, PaginatedResponse, OrderStatus } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { applyDiscountToCart } from '../services/discountService';
import { generateWhatsAppURL, generateConfirmationMessage, generateReadyForDeliveryMessage, generateCancellationMessage } from '../services/whatsappService';
import { emailService } from '../services/emailService';

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

        // Validar stock ANTES de crear la orden
        if (variant.trackStock && !variant.allowBackorder && variant.stock < item.quantity) {
          throw new AppError(
            400,
            `Stock insuficiente para ${variant.name}. Disponible: ${variant.stock}, Solicitado: ${item.quantity}`
          );
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

    // Enviar email de confirmación de pedido (no bloqueante)
    emailService
      .sendOrderConfirmationEmail(order, customerData.email, customerData.name)
      .catch((err) => console.error('Error enviando email de confirmación:', err));

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
      const userId = order.customer.user?._id?.toString() || order.customer.user?.toString();
      const isOwner = userId === req.user.id;
      const isAdminOrFuncionario = ['admin', 'funcionario'].includes(req.user.role);

      if (!isOwner && !isAdminOrFuncionario) {
        throw new AppError(403, 'No tienes permisos para ver esta orden');
      }
    }

    res.status(200).json({
      success: true,
      data: order,
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
      data: order,
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

    const oldStatus = order.status;
    order.status = status;
    if (adminNotes) order.adminNotes = adminNotes;

    await order.save();

    // Enviar email de actualización de estado (no bloqueante)
    emailService
      .sendOrderStatusUpdateEmail(order, order.customer.email, order.customer.name, status)
      .catch((err) => console.error('Error enviando email de actualización de estado:', err));

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

    // Enviar email de cancelación (no bloqueante)
    emailService
      .sendOrderCancellationEmail(order, order.customer.email, order.customer.name)
      .catch((err) => console.error('Error enviando email de cancelación:', err));

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

// @desc    Validar carrito con precios del servidor (anti-fraude)
// @route   POST /api/orders/validate-cart
// @access  Public
export const validateCart = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'El carrito está vacío');
    }

    // Preparar items para el servicio de descuentos
    const cartItems = items.map((item: any) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    // Calcular precios con descuentos usando el servicio del backend
    const calculatedItems = await applyDiscountToCart(cartItems);

    // Comparar con los precios que envió el frontend
    const discrepancies = [];
    let hasDiscrepancy = false;

    for (let i = 0; i < items.length; i++) {
      const frontendItem = items[i];
      const serverItem = calculatedItems[i];

      // Comparar precio unitario final
      if (Math.round(frontendItem.finalPrice) !== Math.round(serverItem.finalPricePerUnit)) {
        hasDiscrepancy = true;
        discrepancies.push({
          variantId: frontendItem.variantId,
          frontend: {
            finalPrice: frontendItem.finalPrice,
            subtotal: frontendItem.subtotal,
          },
          server: {
            finalPrice: serverItem.finalPricePerUnit,
            subtotal: serverItem.subtotal,
          },
        });
      }
    }

    // Si hay discrepancias, retornar error con los precios correctos
    if (hasDiscrepancy) {
      return res.status(400).json({
        success: false,
        message: 'Los precios del carrito no coinciden con los del servidor',
        data: {
          valid: false,
          discrepancies,
          serverPrices: calculatedItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            originalPrice: item.originalPrice,
            finalPricePerUnit: item.finalPricePerUnit,
            totalDiscount: item.totalDiscount,
            subtotal: item.subtotal,
          })),
        },
      });
    }

    // Todo correcto
    return res.status(200).json({
      success: true,
      message: 'Carrito validado correctamente',
      data: {
        valid: true,
        items: calculatedItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          originalPrice: item.originalPrice,
          finalPricePerUnit: item.finalPricePerUnit,
          totalDiscount: item.totalDiscount,
          subtotal: item.subtotal,
        })),
      },
    });
  }
);

// @desc    Editar items de orden (agregar, quitar, cambiar cantidades)
// @route   PUT /api/orders/:id/items
// @access  Private (admin, funcionario)
export const editOrderItems = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items, adminNotes } = req.body;
    const { id } = req.params;

    // Buscar orden
    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

    // Validar que la orden esté en un estado editable
    const editableStates = ['pending_whatsapp', 'confirmed', 'preparing'];
    if (!editableStates.includes(order.status)) {
      throw new AppError(
        400,
        `No se puede editar una orden en estado "${order.status}". Solo se pueden editar órdenes en estados: pending_whatsapp, confirmed, preparing`
      );
    }

    // Preparar items con descuentos aplicados
    const cartItems = items.map((item: any) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    // Aplicar descuentos automáticamente a los nuevos items
    const itemsWithDiscounts = await applyDiscountToCart(cartItems);

    // Construir nuevos items de la orden con snapshots
    const newOrderItems = await Promise.all(
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

    // Comparar items viejos vs nuevos para ajustar stock
    const oldItems = order.items;
    const oldItemsMap = new Map();

    // Mapear items viejos por variantId
    oldItems.forEach((item) => {
      const variantId = item.variant.toString();
      oldItemsMap.set(variantId, item.quantity);
    });

    // Mapear items nuevos por variantId
    const newItemsMap = new Map();
    newOrderItems.forEach((item) => {
      const variantId = item.variant.toString();
      newItemsMap.set(variantId, item.quantity);
    });

    // Procesar cambios de stock
    const stockChanges = [];

    // 1. Items eliminados o con cantidad reducida
    for (const [variantId, oldQuantity] of oldItemsMap) {
      const newQuantity = newItemsMap.get(variantId) || 0;
      const quantityDiff = oldQuantity - newQuantity;

      if (quantityDiff > 0) {
        // Item eliminado o cantidad reducida -> restaurar stock
        stockChanges.push({
          variantId,
          quantityChange: quantityDiff, // positivo = restaurar
          type: 'restoration' as const,
        });
      }
    }

    // 2. Items nuevos o con cantidad aumentada
    for (const [variantId, newQuantity] of newItemsMap) {
      const oldQuantity = oldItemsMap.get(variantId) || 0;
      const quantityDiff = newQuantity - oldQuantity;

      if (quantityDiff > 0) {
        // Item nuevo o cantidad aumentada -> deducir stock
        stockChanges.push({
          variantId,
          quantityChange: quantityDiff, // positivo = deducir
          type: 'deduction' as const,
        });
      }
    }

    // Aplicar cambios de stock y crear StockMovements
    for (const change of stockChanges) {
      const variant = await ProductVariant.findById(change.variantId);

      if (!variant) {
        throw new AppError(404, `Variante ${change.variantId} no encontrada`);
      }

      if (change.type === 'deduction') {
        // Verificar disponibilidad de stock para nuevos items
        if (variant.trackStock && !variant.allowBackorder) {
          if (variant.stock < change.quantityChange) {
            throw new AppError(
              400,
              `Stock insuficiente para ${variant.name}. Disponible: ${variant.stock}, requerido: ${change.quantityChange}`
            );
          }
        }

        // Deducir stock
        const previousStock = variant.stock;
        variant.stock -= change.quantityChange;
        await variant.save();

        // Crear StockMovement de tipo 'adjustment' para edición
        await StockMovement.create({
          type: 'adjustment',
          quantity: -change.quantityChange,
          previousStock,
          newStock: variant.stock,
          variant: variant._id,
          order: order._id,
          user: req.user?.id,
          reason: `Edición de orden ${order.orderNumber} - Item agregado/aumentado`,
          notes: adminNotes || `Cantidad agregada: ${change.quantityChange}`,
        });
      } else {
        // Restaurar stock
        const previousStock = variant.stock;
        variant.stock += change.quantityChange;
        await variant.save();

        // Crear StockMovement de tipo 'adjustment'
        await StockMovement.create({
          type: 'adjustment',
          quantity: change.quantityChange,
          previousStock,
          newStock: variant.stock,
          variant: variant._id,
          order: order._id,
          user: req.user?.id,
          reason: `Edición de orden ${order.orderNumber} - Item eliminado/reducido`,
          notes: adminNotes || `Cantidad restaurada: ${change.quantityChange}`,
        });
      }
    }

    // Actualizar items de la orden
    order.items = newOrderItems as any;

    // Recalcular totales
    const subtotal = newOrderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = newOrderItems.reduce((sum, item) => sum + item.discount, 0);

    order.subtotal = subtotal;
    order.totalDiscount = totalDiscount;
    order.total = subtotal + order.shippingCost;

    // Agregar notas del admin si se proporcionaron
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    // Registrar quién actualizó la orden
    if (req.user) {
      order.updatedBy = req.user.id as any;
    }

    // Guardar orden
    await order.save();

    // Enviar email de notificación al cliente sobre la edición del pedido (no bloqueante)
    emailService
      .sendOrderEditEmail(
        order,
        order.customer.email,
        order.customer.name,
        {
          oldItems,
          newItems: newOrderItems,
        }
      )
      .catch((err) => console.error('Error enviando email de edición de pedido:', err));

    res.status(200).json({
      success: true,
      message: 'Orden actualizada exitosamente',
      data: {
        order,
        stockChanges: stockChanges.map((change) => ({
          variantId: change.variantId,
          quantityChange: change.quantityChange,
          type: change.type,
        })),
      },
    });
  }
);

// @desc    Actualizar costo de envío de una orden
// @route   PUT /api/orders/:id/shipping
// @access  Private (admin, funcionario)
export const updateShippingCost = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const { shippingCost } = req.body;

    if (!req.user) {
      throw new AppError(401, 'Usuario no autenticado');
    }

    // Validar que shippingCost sea un número válido
    if (typeof shippingCost !== 'number' || shippingCost < 0) {
      throw new AppError(400, 'Costo de envío inválido');
    }

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

    // No se puede modificar órdenes completadas o canceladas
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new AppError(400, 'No se puede modificar el costo de envío de una orden completada o cancelada');
    }

    // Actualizar costo de envío
    order.shippingCost = shippingCost;
    order.total = order.subtotal + shippingCost;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Costo de envío actualizado exitosamente',
      data: order,
    });
  }
);
