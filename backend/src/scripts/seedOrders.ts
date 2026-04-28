import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from '../models/Order';
import ProductVariant from '../models/ProductVariant';
import { User } from '../models/User';

dotenv.config();

/**
 * Script para crear órdenes de prueba en diferentes estados
 * Cubre todos los flujos del sistema de órdenes:
 * - Diferentes estados (pending, confirmed, processing, completed, cancelled)
 * - Diferentes métodos de entrega y pago
 * - Con y sin descuentos
 * - Con diferentes cantidades de items
 */

async function seedOrders() {
  try {
    console.log('🔄 Iniciando seed de órdenes...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Verificar que existan productos y usuarios
    const variants = await ProductVariant.find({ active: true }).limit(10);
    const users = await User.find({ role: 'cliente' }).limit(5);

    if (variants.length === 0) {
      console.log('⚠️  No hay variantes de productos para crear órdenes.');
      console.log('   Ejecuta primero: npm run seed:products');
      return;
    }

    console.log(`📦 Encontradas ${variants.length} variantes de productos`);
    console.log(`👥 Encontrados ${users.length} usuarios\n`);

    // Preguntar si limpiar órdenes existentes
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('¿Deseas eliminar todas las órdenes existentes antes de crear nuevas? (s/n): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      const deleteCount = await Order.deleteMany({});
      console.log(`\n🗑️  ${deleteCount.deletedCount} órdenes eliminadas\n`);
    }

    let createdCount = 0;

    // Helper para crear items de orden
    const createOrderItem = (variant: any, quantity: number = 1) => {
      const pricePerUnit = variant.price;
      const discount = 0; // Simplificado para el seed
      const subtotal = pricePerUnit * quantity - discount;

      return {
        variant: variant._id,
        variantSnapshot: {
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          attributes: Object.fromEntries(variant.attributes || new Map()),
          image: variant.images?.[0] || '',
        },
        quantity,
        pricePerUnit,
        discount,
        subtotal,
      };
    };

    // Orden 1: Pendiente - Un solo item
    const order1Items = [createOrderItem(variants[0], 1)];
    const order1 = await Order.create({
      customer: {
        user: users[0]?._id,
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '+595981123456',
        address: {
          street: 'Av. España',
          number: '1234',
          city: 'Santiago',
          neighborhood: 'Villa Morra',
        },
      },
      items: order1Items,
      subtotal: order1Items.reduce((sum, item) => sum + item.subtotal, 0),
      totalDiscount: 0,
      shippingCost: 15000,
      total: order1Items.reduce((sum, item) => sum + item.subtotal, 0) + 15000,
      deliveryMethod: 'delivery',
      paymentMethod: 'transfer',
      status: 'pending',
      whatsappSent: false,
      customerNotes: 'Por favor enviar por la mañana',
    });
    console.log(`✅ Orden ${order1.orderNumber} - Estado: PENDING (1 item)`);
    createdCount++;

    // Orden 2: Confirmada - Múltiples items
    const order2Items = [
      createOrderItem(variants[1], 2),
      createOrderItem(variants[2], 1),
    ];
    const order2 = await Order.create({
      customer: {
        user: users[1]?._id,
        name: 'María González',
        email: 'maria.gonzalez@example.com',
        phone: '+595982234567',
        address: {
          street: 'Mcal. López',
          number: '567',
          city: 'Santiago',
          neighborhood: 'Centro',
        },
      },
      items: order2Items,
      subtotal: order2Items.reduce((sum, item) => sum + item.subtotal, 0),
      totalDiscount: 0,
      shippingCost: 20000,
      total: order2Items.reduce((sum, item) => sum + item.subtotal, 0) + 20000,
      deliveryMethod: 'delivery',
      paymentMethod: 'transfer',
      status: 'confirmed',
      whatsappSent: true,
      whatsappSentAt: new Date(),
      confirmedAt: new Date(),
    });
    console.log(`✅ Orden ${order2.orderNumber} - Estado: CONFIRMED (2 items)`);
    createdCount++;

    // Orden 3: En proceso - Retiro en tienda
    const order3Items = [createOrderItem(variants[3], 3)];
    const order3 = await Order.create({
      customer: {
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@example.com',
        phone: '+595983345678',
      },
      items: order3Items,
      subtotal: order3Items.reduce((sum, item) => sum + item.subtotal, 0),
      totalDiscount: 0,
      shippingCost: 0,
      total: order3Items.reduce((sum, item) => sum + item.subtotal, 0),
      deliveryMethod: 'pickup',
      paymentMethod: 'cash',
      status: 'processing',
      whatsappSent: true,
      whatsappSentAt: new Date(),
      confirmedAt: new Date(),
      adminNotes: 'Cliente llegará a las 14:00',
    });
    console.log(`✅ Orden ${order3.orderNumber} - Estado: PROCESSING (retiro en tienda)`);
    createdCount++;

    // Orden 4: Completada - Orden grande
    const order4Items = [
      createOrderItem(variants[4], 5),
      createOrderItem(variants[5], 2),
      createOrderItem(variants[6], 3),
    ];
    const order4 = await Order.create({
      customer: {
        user: users[2]?._id,
        name: 'Ana Martínez',
        email: 'ana.martinez@example.com',
        phone: '+595984456789',
        address: {
          street: 'Av. Mariscal López',
          number: '890',
          city: 'Santiago',
          neighborhood: 'Recoleta',
        },
      },
      items: order4Items,
      subtotal: order4Items.reduce((sum, item) => sum + item.subtotal, 0),
      totalDiscount: 0,
      shippingCost: 25000,
      total: order4Items.reduce((sum, item) => sum + item.subtotal, 0) + 25000,
      deliveryMethod: 'delivery',
      paymentMethod: 'transfer',
      status: 'completed',
      whatsappSent: true,
      whatsappSentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
      confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
    });
    console.log(`✅ Orden ${order4.orderNumber} - Estado: COMPLETED (3 items diferentes)`);
    createdCount++;

    // Orden 5: Cancelada
    const order5Items = [createOrderItem(variants[7], 1)];
    const order5 = await Order.create({
      customer: {
        name: 'Pedro Sánchez',
        email: 'pedro.sanchez@example.com',
        phone: '+595985567890',
        address: {
          street: 'Av. Artigas',
          number: '123',
          city: 'Santiago',
          neighborhood: 'Sajonia',
        },
      },
      items: order5Items,
      subtotal: order5Items.reduce((sum, item) => sum + item.subtotal, 0),
      totalDiscount: 0,
      shippingCost: 15000,
      total: order5Items.reduce((sum, item) => sum + item.subtotal, 0) + 15000,
      deliveryMethod: 'delivery',
      paymentMethod: 'transfer',
      status: 'cancelled',
      whatsappSent: false,
      cancelledAt: new Date(),
      cancellationReason: 'Cliente solicitó cancelación',
    });
    console.log(`✅ Orden ${order5.orderNumber} - Estado: CANCELLED`);
    createdCount++;

    // Orden 6: Pendiente con comprobante de pago
    const order6Items = [createOrderItem(variants[8], 2)];
    const order6 = await Order.create({
      customer: {
        user: users[3]?._id,
        name: 'Laura Benítez',
        email: 'laura.benitez@example.com',
        phone: '+595986678901',
        address: {
          street: 'Av. Quesada',
          number: '456',
          city: 'Santiago',
          neighborhood: 'Barrio Jara',
        },
      },
      items: order6Items,
      subtotal: order6Items.reduce((sum, item) => sum + item.subtotal, 0),
      totalDiscount: 0,
      shippingCost: 20000,
      total: order6Items.reduce((sum, item) => sum + item.subtotal, 0) + 20000,
      deliveryMethod: 'delivery',
      paymentMethod: 'transfer',
      paymentProof: 'https://example.com/comprobante123.jpg',
      status: 'pending',
      whatsappSent: false,
      customerNotes: 'Comprobante adjunto',
    });
    console.log(`✅ Orden ${order6.orderNumber} - Estado: PENDING (con comprobante)`);
    createdCount++;

    // Resumen
    console.log('\n' + '═'.repeat(100));
    console.log('📊 RESUMEN DE ÓRDENES CREADAS');
    console.log('═'.repeat(100));
    console.log(`✅ Órdenes creadas: ${createdCount}`);
    console.log('═'.repeat(100) + '\n');

    // Mostrar tabla de órdenes
    console.log('═'.repeat(120));
    console.log('📦 ÓRDENES EN EL SISTEMA');
    console.log('═'.repeat(120));
    console.log('');

    const allOrders = await Order.find({}).sort({ createdAt: -1 });

    allOrders.forEach((order, index) => {
      const num = `${(index + 1).toString().padStart(2, ' ')}.`;
      const orderNum = order.orderNumber.padEnd(15, ' ');
      const status = order.status.padEnd(12, ' ');
      const customer = order.customer.name.substring(0, 25).padEnd(25, ' ');
      const total = `Gs. ${order.total.toLocaleString()}`.padEnd(18, ' ');
      const items = `${order.items.length} item(s)`.padEnd(10, ' ');
      const delivery = order.deliveryMethod === 'delivery' ? '🚚 Envío' : '🏪 Retiro';

      console.log(`${num} ${orderNum} | ${status} | ${customer} | ${total} | ${items} | ${delivery}`);
    });

    console.log('\n' + '═'.repeat(120) + '\n');

    // Estadísticas
    const stats = {
      pending: await Order.countDocuments({ status: 'pending' }),
      confirmed: await Order.countDocuments({ status: 'confirmed' }),
      processing: await Order.countDocuments({ status: 'processing' }),
      completed: await Order.countDocuments({ status: 'completed' }),
      cancelled: await Order.countDocuments({ status: 'cancelled' }),
    };

    console.log('📈 ESTADÍSTICAS POR ESTADO:');
    console.log(`   Pendientes: ${stats.pending}`);
    console.log(`   Confirmadas: ${stats.confirmed}`);
    console.log(`   En proceso: ${stats.processing}`);
    console.log(`   Completadas: ${stats.completed}`);
    console.log(`   Canceladas: ${stats.cancelled}\n`);

  } catch (error: any) {
    console.error('❌ Error fatal en seed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
if (require.main === module) {
  seedOrders();
}

export default seedOrders;
