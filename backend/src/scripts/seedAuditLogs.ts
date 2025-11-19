import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';
import User from '../models/User';
import Order from '../models/Order';
import ProductVariant from '../models/ProductVariant';

/**
 * Script para crear datos de auditoría de prueba
 * Ejecutar: npx ts-node src/scripts/seedAuditLogs.ts
 */

async function seedAuditLogs() {
  try {
    // Conectar a la base de datos
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiteria-quelita';
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Conectado a MongoDB');

    // Obtener usuarios admin/funcionario
    const users = await User.find({ role: { $in: ['admin', 'funcionario'] } }).limit(3);

    if (users.length === 0) {
      console.log('⚠️  No se encontraron usuarios admin o funcionario. Crea usuarios primero.');
      process.exit(1);
    }

    // Obtener algunas órdenes y productos para usar como entityId
    const orders = await Order.find().limit(10);
    const variants = await ProductVariant.find().limit(10);

    console.log(`👥 Encontrados ${users.length} usuarios`);
    console.log(`📦 Encontradas ${orders.length} órdenes`);
    console.log(`🛍️  Encontradas ${variants.length} variantes`);

    // Limpiar logs existentes (opcional)
    const confirm = process.argv.includes('--clean');
    if (confirm) {
      await AuditLog.deleteMany({});
      console.log('🗑️  Logs de auditoría eliminados');
    }

    // Crear 50 logs de auditoría de ejemplo
    const actions = ['create', 'update', 'delete', 'cancel', 'block'];
    const entities = ['order', 'variant', 'product', 'user', 'category'];
    const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.10'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
    ];

    const logsToCreate = [];

    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)] as any;
      const entity = entities[Math.floor(Math.random() * entities.length)] as any;

      // Elegir un entityId válido basado en la entidad
      let entityId: mongoose.Types.ObjectId;
      if (entity === 'order' && orders.length > 0) {
        entityId = orders[Math.floor(Math.random() * orders.length)]._id;
      } else if (entity === 'variant' && variants.length > 0) {
        entityId = variants[Math.floor(Math.random() * variants.length)]._id;
      } else {
        entityId = new mongoose.Types.ObjectId();
      }

      // Crear cambios de ejemplo
      const changes: any = {};
      if (action === 'create') {
        changes.after = {
          name: `Item ${i + 1}`,
          status: 'active',
          createdAt: new Date(),
        };
      } else if (action === 'update') {
        changes.before = {
          name: `Item ${i + 1} Old`,
          status: 'pending',
        };
        changes.after = {
          name: `Item ${i + 1} Updated`,
          status: 'active',
        };
      } else if (action === 'delete') {
        changes.before = {
          name: `Item ${i + 1}`,
          status: 'active',
        };
      }

      logsToCreate.push({
        user: user._id,
        action,
        entity,
        entityId,
        changes,
        ipAddress: ips[Math.floor(Math.random() * ips.length)],
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
      });
    }

    // Insertar logs
    await AuditLog.insertMany(logsToCreate);
    console.log(`✅ Creados ${logsToCreate.length} logs de auditoría de prueba`);

    // Mostrar estadísticas
    const stats = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log('\n📊 Estadísticas de logs creados:');
    stats.forEach((stat) => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear logs de auditoría:', error);
    process.exit(1);
  }
}

// Ejecutar
seedAuditLogs();
