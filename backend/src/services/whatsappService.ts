import { IOrder } from '../models/Order';

/**
 * Service para integración con WhatsApp
 * Actualizado para soportar direcciones opcionales
 */

interface FloatButtonConfig {
  phoneNumber: string;
  accountName: string;
  statusMessage: string;
  chatMessage: string;
  placeholder: string;
  avatar: string;
}

/**
 * Genera el mensaje formateado de WhatsApp para una orden
 * @param order Orden a formatear
 * @returns Mensaje formateado para WhatsApp
 */
export function generateOrderMessage(order: IOrder): string {
  try {
    const lines: string[] = [];

    // Header
    lines.push('🛍️ *NUEVA ORDEN - CONFITERÍA QUELITA*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    // Número de orden y fecha
    lines.push(`📋 *Orden:* ${order.orderNumber}`);
    const fecha = new Date(order.createdAt).toLocaleString('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    lines.push(`📅 *Fecha:* ${fecha}`);
    lines.push('');

    // Datos del cliente
    lines.push('👤 *DATOS DEL CLIENTE*');
    lines.push(`Nombre: ${order.customer.name}`);
    if (order.customer.email) {
      lines.push(`Email: ${order.customer.email}`);
    }
    lines.push(`Teléfono: ${order.customer.phone}`);
    lines.push('');

    // Dirección de entrega (si aplica)
    if (order.deliveryMethod === 'delivery') {
      lines.push('📍 *DIRECCIÓN DE ENTREGA*');

      if (order.customer.address) {
        // Dirección disponible
        lines.push(`${order.customer.address.street} ${order.customer.address.number}`);
        lines.push(`${order.customer.address.city}`);

        if (order.customer.address.neighborhood) {
          lines.push(`Barrio: ${order.customer.address.neighborhood}`);
        }

        if (order.customer.address.reference) {
          lines.push(`Referencia: ${order.customer.address.reference}`);
        }
      } else {
        // Sin dirección guardada
        lines.push('⚠️ _Dirección no proporcionada_');
        lines.push('Por favor solicitar al cliente la dirección de entrega.');
      }

      // Notas adicionales de entrega
      if (order.deliveryNotes) {
        lines.push('');
        lines.push('📝 *Notas de entrega:*');
        lines.push(order.deliveryNotes);
      }

      lines.push('');
    } else {
      lines.push('🏪 *RETIRO EN LOCAL*');
      lines.push('');
    }

    // Productos
    lines.push('🛒 *PRODUCTOS*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');

    order.items.forEach((item, index) => {
      lines.push('');
      lines.push(`*${index + 1}. ${item.productSnapshot.name}*`);
      lines.push(`   SKU: ${item.productSnapshot.barcode}`);

      // Mostrar atributos de la variante (ej: tamaño, sabor, etc.)
      // Convert Mongoose Map to plain object
      const attributesMap = item.productSnapshot.saleUnit;
      const attributesObj = attributesMap instanceof Map
        ? Object.fromEntries(attributesMap.entries())
        : (typeof attributesMap === 'object' && attributesMap !== null
           ? attributesMap
           : {});

      const attributes = Object.entries(attributesObj);
      if (attributes.length > 0) {
        const attrString = attributes
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        lines.push(`   ${attrString}`);
      }

      lines.push(`   Cantidad: ${item.quantity} un`);

      // Mostrar precio unitario
      const precioFormateado = item.pricePerUnit.toLocaleString('es-CL');
      lines.push(`   Precio c/u: $${precioFormateado}`);

      // Si tiene descuento, mostrarlo
      if (item.discount > 0) {
        const descuentoFormateado = item.discount.toLocaleString('es-CL');
        lines.push(`   💰 Descuento: $${descuentoFormateado}`);
      }

      // Subtotal del item
      const subtotalFormateado = item.subtotal.toLocaleString('es-CL');
      lines.push(`   *Subtotal: $${subtotalFormateado}*`);
    });

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');

    // Resumen de montos
    lines.push('');
    lines.push('💵 *RESUMEN*');
    const subtotalFormateado = order.subtotal.toLocaleString('es-CL');
    lines.push(`Subtotal: $${subtotalFormateado}`);

    if (order.totalDiscount > 0) {
      const totalDescuentoFormateado = order.totalDiscount.toLocaleString('es-CL');
      lines.push(`Descuento total: -$${totalDescuentoFormateado}`);
    }

    if (order.shippingCost > 0) {
      const envioFormateado = order.shippingCost.toLocaleString('es-CL');
      lines.push(`Envío: $${envioFormateado}`);
    } else if (order.deliveryMethod === 'delivery') {
      lines.push('Envío: _A confirmar_');
    }

    const totalFormateado = order.total.toLocaleString('es-CL');
    lines.push(`*TOTAL: $${totalFormateado}*`);

    if (order.shippingCost === 0 && order.deliveryMethod === 'delivery') {
      lines.push('_Total final se confirmará con el costo de envío_');
    }

    lines.push('');

    // Método de pago
    lines.push('💳 *MÉTODO DE PAGO*');
    const metodoPago = order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia';
    lines.push(metodoPago);
    lines.push('');

    // Notas del cliente (si existen)
    if (order.customerNotes) {
      lines.push('📝 *NOTAS DEL CLIENTE*');
      lines.push(order.customerNotes);
      lines.push('');
    }

    // Footer
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('Por favor, confirma la recepción de esta orden.');
    lines.push('');
    lines.push('_Confitería Quelita_');
    lines.push('📞 Lun-Sáb 9am-9pm | Dom 9am-2pm');

    return lines.join('\n');
  } catch (error) {
    console.error('Error en generateOrderMessage:', error);
    throw error;
  }
}

/**
 * Formatea la lista de productos de una orden de manera compacta
 * @param items Items de la orden
 * @returns Lista de productos formateada
 */
export function formatProductList(order: IOrder): string {
  try {
    const items = order.items.map((item, index) => {
      let line = `${index + 1}. ${item.productSnapshot.name}`;

      // Agregar atributos si existen
      // Convert Mongoose Map to plain object
      const attributesMap = item.productSnapshot.saleUnit;
      const attributesObj = attributesMap instanceof Map
        ? Object.fromEntries(attributesMap.entries())
        : (typeof attributesMap === 'object' && attributesMap !== null
           ? attributesMap
           : {});

      const attributes = Object.entries(attributesObj);
      if (attributes.length > 0) {
        const attrString = attributes.map(([_, value]) => value).join(' ');
        line += ` (${attrString})`;
      }

      line += ` x${item.quantity}`;

      return line;
    });

    return items.join('\n');
  } catch (error) {
    console.error('Error en formatProductList:', error);
    throw error;
  }
}

/**
 * Genera URL de WhatsApp pre-llenada para compartir orden
 * @param order Orden a compartir
 * @param phoneNumber Número de WhatsApp del negocio (formato internacional)
 * @returns URL de WhatsApp Web
 */
export function generateWhatsAppURL(order: IOrder, phoneNumber: string): string {
  try {
    // Limpiar el número de teléfono (solo dígitos)
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Generar el mensaje
    const message = generateOrderMessage(order);

    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);

    // Generar URL de WhatsApp Web
    const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    return whatsappURL;
  } catch (error) {
    console.error('Error en generateWhatsAppURL:', error);
    throw error;
  }
}

/**
 * Retorna la configuración del botón flotante de WhatsApp
 * @returns Configuración para react-floating-whatsapp
 */
export function getFloatButtonConfig(): FloatButtonConfig {
  return {
    phoneNumber: process.env.WHATSAPP_BUSINESS_PHONE || '595981234567',
    accountName: 'Confitería Quelita',
    statusMessage: 'Lun-Sáb 9am-9pm | Dom 9am-2pm',
    chatMessage: '¡Hola! ¿En qué podemos ayudarte?',
    placeholder: 'Escribe tu mensaje...',
    avatar: '/images/logo-quelita.png',
  };
}

/**
 * Genera mensaje de "pedido recibido" para el cliente (al crear orden)
 * Este es el primer mensaje que recibe el cliente
 * @param order Orden recién creada
 * @returns Mensaje de recepción
 */
export function generateOrderReceivedMessage(order: IOrder): string {
  try {
    const lines: string[] = [];

    lines.push('📦 *PEDIDO RECIBIDO*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Hola *${order.customer.name}*,`);
    lines.push('');
    lines.push(`Recibimos tu pedido *${order.orderNumber}*.`);
    lines.push('');

    // Productos resumidos
    lines.push('🛒 *Productos:*');
    order.items.forEach((item) => {
      const precioFormateado = item.subtotal.toLocaleString('es-CL');
      lines.push(`• ${item.quantity}x ${item.productSnapshot.name} - $${precioFormateado}`);
    });
    lines.push('');

    // Subtotal
    const subtotalFormateado = order.subtotal.toLocaleString('es-CL');
    lines.push(`💵 Subtotal: *$${subtotalFormateado}*`);

    if (order.deliveryMethod === 'delivery') {
      lines.push('🚚 Envío: _Por confirmar_');
    }
    lines.push('');

    lines.push('⏳ Estamos revisando tu pedido.');
    lines.push('Te confirmaremos en breve con el total final.');
    lines.push('');
    lines.push('_Gracias por tu preferencia_');

    return lines.join('\n');
  } catch (error) {
    console.error('Error en generateOrderReceivedMessage:', error);
    throw error;
  }
}

/**
 * Genera mensaje de confirmación de orden para cliente
 * @param order Orden confirmada
 * @returns Mensaje de confirmación
 */
export function generateConfirmationMessage(order: IOrder): string {
  try {
    const lines: string[] = [];

    lines.push('✅ *ORDEN CONFIRMADA*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Hola *${order.customer.name}*,`);
    lines.push('');
    lines.push(`Tu orden *${order.orderNumber}* ha sido confirmada.`);
    lines.push('');

    // Productos resumidos
    lines.push('📦 *Productos:*');
    order.items.forEach((item) => {
      lines.push(`• ${item.quantity}x ${item.productSnapshot.name}`);
    });
    lines.push('');

    // Total
    const totalFormateado = order.total.toLocaleString('es-CL');
    lines.push(`💵 Total: *$${totalFormateado}*`);
    lines.push('');

    // Información de entrega
    if (order.deliveryMethod === 'delivery') {
      lines.push('🚚 Tu pedido será enviado a:');

      if (order.customer.address) {
        lines.push(`${order.customer.address.street} ${order.customer.address.number}`);
        lines.push(`${order.customer.address.city}`);

        if (order.customer.address.neighborhood) {
          lines.push(`Barrio: ${order.customer.address.neighborhood}`);
        }
      } else if (order.deliveryNotes) {
        lines.push(order.deliveryNotes);
      }
    } else {
      lines.push('🏪 Puedes retirar tu pedido en nuestro local.');
    }
    lines.push('');

    lines.push('Te mantendremos informado del estado de tu orden.');
    lines.push('');
    lines.push('_Confitería Quelita_');
    lines.push('📞 Lun-Sáb 9am-9pm | Dom 9am-2pm');

    return lines.join('\n');
  } catch (error) {
    console.error('Error en generateConfirmationMessage:', error);
    throw error;
  }
}

/**
 * Genera mensaje de orden lista para entrega/retiro
 * @param order Orden lista
 * @returns Mensaje de notificación
 */
export function generateReadyForDeliveryMessage(order: IOrder): string {
  try {
    const lines: string[] = [];

    lines.push('🎉 *TU PEDIDO ESTÁ LISTO*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Hola *${order.customer.name}*,`);
    lines.push('');
    lines.push(`Tu orden *${order.orderNumber}* ya está lista.`);
    lines.push('');

    if (order.deliveryMethod === 'delivery') {
      lines.push('🚚 *Será enviada pronto*');
      lines.push('Te avisaremos cuando el repartidor esté en camino.');
    } else {
      lines.push('🏪 *Puedes pasar a retirarla*');
      lines.push('');
      lines.push('📍 Confitería Quelita');
      lines.push('⏰ Lun-Sáb 9am-9pm | Dom 9am-2pm');
    }
    lines.push('');

    const totalFormateado = order.total.toLocaleString('es-CL');
    lines.push(`💵 Total a pagar: *$${totalFormateado}*`);

    if (order.paymentMethod === 'cash') {
      lines.push('💰 Pago en efectivo');
    } else {
      lines.push('💳 Pago por transferencia');
    }

    lines.push('');
    lines.push('¡Gracias por tu compra!');
    lines.push('');
    lines.push('_Confitería Quelita_');

    return lines.join('\n');
  } catch (error) {
    console.error('Error en generateReadyForDeliveryMessage:', error);
    throw error;
  }
}

/**
 * Genera mensaje de orden editada para el cliente
 * @param order Orden editada
 * @returns Mensaje de actualización
 */
export function generateOrderEditedMessage(order: IOrder): string {
  try {
    const lines: string[] = [];

    lines.push('✏️ *PEDIDO ACTUALIZADO*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Hola *${order.customer.name}*,`);
    lines.push('');
    lines.push(`Tu pedido *${order.orderNumber}* ha sido modificado.`);
    lines.push('');

    // Productos actualizados
    lines.push('🛒 *Productos actuales:*');
    order.items.forEach((item) => {
      const precioFormateado = item.subtotal.toLocaleString('es-CL');
      lines.push(`• ${item.quantity}x ${item.productSnapshot.name} - $${precioFormateado}`);
    });
    lines.push('');

    // Totales
    const subtotalFormateado = order.subtotal.toLocaleString('es-CL');
    lines.push(`Subtotal: $${subtotalFormateado}`);

    if (order.shippingCost > 0) {
      const envioFormateado = order.shippingCost.toLocaleString('es-CL');
      lines.push(`Envío: $${envioFormateado}`);
    }

    const totalFormateado = order.total.toLocaleString('es-CL');
    lines.push(`💵 *Total: $${totalFormateado}*`);
    lines.push('');

    lines.push('Si tienes alguna duda sobre los cambios, contáctanos.');
    lines.push('');
    lines.push('_Gracias por tu preferencia_');

    return lines.join('\n');
  } catch (error) {
    console.error('Error en generateOrderEditedMessage:', error);
    throw error;
  }
}

/**
 * Genera mensaje de orden completada para el cliente
 * @param order Orden completada
 * @returns Mensaje de agradecimiento
 */
export function generateCompletedMessage(order: IOrder): string {
  try {
    const lines: string[] = [];

    lines.push('🎉 *¡PEDIDO ENTREGADO!*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Hola *${order.customer.name}*,`);
    lines.push('');
    lines.push(`Tu orden *${order.orderNumber}* ha sido entregada.`);
    lines.push('');
    lines.push('¡Gracias por tu compra! 🙏');
    lines.push('');
    lines.push('Esperamos que disfrutes tus productos.');
    lines.push('Si tienes alguna consulta, no dudes en escribirnos.');
    lines.push('');
    lines.push('⭐ Tu opinión es importante para nosotros.');
    lines.push('');
    lines.push('_¡Te esperamos pronto!_');

    return lines.join('\n');
  } catch (error) {
    console.error('Error en generateCompletedMessage:', error);
    throw error;
  }
}

/**
 * Genera mensaje de orden cancelada
 * @param order Orden cancelada
 * @returns Mensaje de cancelación
 */
export function generateCancellationMessage(order: IOrder): string {
  try {
    const lines: string[] = [];

    lines.push('❌ *ORDEN CANCELADA*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Hola *${order.customer.name}*,`);
    lines.push('');
    lines.push(`Tu orden *${order.orderNumber}* ha sido cancelada.`);
    lines.push('');

    if (order.cancellationReason) {
      lines.push('*Motivo:*');
      lines.push(order.cancellationReason);
      lines.push('');
    }

    lines.push('Si tienes alguna duda, no dudes en contactarnos.');
    lines.push('');
    lines.push('_Confitería Quelita_');
    lines.push('📞 Lun-Sáb 9am-9pm | Dom 9am-2pm');

    return lines.join('\n');
  } catch (error) {
    console.error('Error en generateCancellationMessage:', error);
    throw error;
  }
}
