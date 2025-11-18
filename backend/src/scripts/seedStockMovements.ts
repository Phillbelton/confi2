import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StockMovement from '../models/StockMovement';
import ProductVariant from '../models/ProductVariant';
import { User } from '../models/User';

dotenv.config();

/**
 * Script para crear movimientos de stock de prueba
 * Cubre todos los tipos de movimientos:
 * - restock: Reabastecimiento de inventario
 * - sale: Venta de productos
 * - adjustment: Ajustes manuales (positivos y negativos)
 * - return: Devoluciones
 * - cancellation: Cancelaciones de ventas
 */

async function seedStockMovements() {
  try {
    console.log('🔄 Iniciando seed de movimientos de stock...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Verificar que existan productos y usuarios
    const variants = await ProductVariant.find({ active: true }).limit(10);
    const users = await User.find({ role: { $in: ['admin', 'funcionario'] } }).limit(3);

    if (variants.length === 0) {
      console.log('⚠️  No hay variantes de productos para crear movimientos de stock.');
      console.log('   Ejecuta primero: npm run seed:products');
      return;
    }

    console.log(`📦 Encontradas ${variants.length} variantes de productos`);
    console.log(`👥 Encontrados ${users.length} usuarios administradores\n`);

    // Preguntar si limpiar movimientos existentes
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('¿Deseas eliminar todos los movimientos de stock existentes antes de crear nuevos? (s/n): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      const deleteCount = await StockMovement.deleteMany({});
      console.log(`\n🗑️  ${deleteCount.deletedCount} movimientos eliminados\n`);
    }

    let createdCount = 0;

    // Función helper para crear movimientos
    const createMovement = async (
      variant: any,
      type: 'sale' | 'cancellation' | 'adjustment' | 'return' | 'restock',
      quantity: number,
      reason: string,
      notes?: string
    ) => {
      const previousStock = variant.stock;
      const newStock = previousStock + quantity;

      // Actualizar stock de la variante
      variant.stock = newStock;
      await variant.save();

      // Crear movimiento
      const movement = await StockMovement.create({
        variant: variant._id,
        type,
        quantity,
        previousStock,
        newStock,
        user: users[0]?._id,
        reason,
        notes,
      });

      return movement;
    };

    // Movimiento 1: Restock inicial - Producto 1
    console.log('📈 Creando movimientos de RESTOCK...');
    await createMovement(
      variants[0],
      'restock',
      100,
      'Reabastecimiento inicial de inventario',
      'Lote REC-001'
    );
    console.log(`✅ Restock: ${variants[0].name} +100 unidades`);
    createdCount++;

    // Movimiento 2: Restock - Producto 2
    await createMovement(
      variants[1],
      'restock',
      50,
      'Reabastecimiento mensual',
      'Proveedor: ABC SA'
    );
    console.log(`✅ Restock: ${variants[1].name} +50 unidades`);
    createdCount++;

    // Movimiento 3: Restock - Producto 3
    await createMovement(
      variants[2],
      'restock',
      75,
      'Reabastecimiento de urgencia',
      'Stock bajo detectado'
    );
    console.log(`✅ Restock: ${variants[2].name} +75 unidades`);
    createdCount++;

    // Movimientos de ventas
    console.log('\n💰 Creando movimientos de VENTA...');
    await createMovement(
      variants[0],
      'sale',
      -5,
      'Venta a cliente',
      'Orden #12345'
    );
    console.log(`✅ Venta: ${variants[0].name} -5 unidades`);
    createdCount++;

    await createMovement(
      variants[1],
      'sale',
      -3,
      'Venta a cliente',
      'Orden #12346'
    );
    console.log(`✅ Venta: ${variants[1].name} -3 unidades`);
    createdCount++;

    await createMovement(
      variants[2],
      'sale',
      -10,
      'Venta mayorista',
      'Orden #12347 - Cliente mayorista'
    );
    console.log(`✅ Venta: ${variants[2].name} -10 unidades`);
    createdCount++;

    // Movimientos de ajuste
    console.log('\n🔧 Creando movimientos de AJUSTE...');
    await createMovement(
      variants[3],
      'adjustment',
      20,
      'Ajuste por conteo físico',
      'Se encontraron 20 unidades adicionales en bodega'
    );
    console.log(`✅ Ajuste positivo: ${variants[3].name} +20 unidades`);
    createdCount++;

    await createMovement(
      variants[4],
      'adjustment',
      -8,
      'Ajuste por daño de mercadería',
      'Productos dañados durante transporte'
    );
    console.log(`✅ Ajuste negativo: ${variants[4].name} -8 unidades`);
    createdCount++;

    await createMovement(
      variants[5],
      'adjustment',
      15,
      'Corrección de inventario',
      'Error de registro anterior'
    );
    console.log(`✅ Ajuste positivo: ${variants[5].name} +15 unidades`);
    createdCount++;

    // Movimientos de devolución
    console.log('\n↩️  Creando movimientos de DEVOLUCIÓN...');
    await createMovement(
      variants[0],
      'return',
      2,
      'Devolución de cliente',
      'Producto no cumplió expectativas'
    );
    console.log(`✅ Devolución: ${variants[0].name} +2 unidades`);
    createdCount++;

    await createMovement(
      variants[1],
      'return',
      1,
      'Devolución por defecto de fábrica',
      'Producto con defecto detectado'
    );
    console.log(`✅ Devolución: ${variants[1].name} +1 unidad`);
    createdCount++;

    // Movimientos de cancelación
    console.log('\n❌ Creando movimientos de CANCELACIÓN...');
    await createMovement(
      variants[2],
      'cancellation',
      3,
      'Cancelación de venta',
      'Cliente canceló orden antes de entrega'
    );
    console.log(`✅ Cancelación: ${variants[2].name} +3 unidades`);
    createdCount++;

    // Movimientos adicionales para crear historial
    console.log('\n📊 Creando movimientos adicionales para historial...');

    // Producto 6 - Serie de movimientos
    await createMovement(variants[6], 'restock', 80, 'Reabastecimiento inicial');
    await createMovement(variants[6], 'sale', -12, 'Venta', 'Orden #12348');
    await createMovement(variants[6], 'sale', -8, 'Venta', 'Orden #12349');
    await createMovement(variants[6], 'return', 2, 'Devolución', 'Cliente insatisfecho');
    await createMovement(variants[6], 'adjustment', -3, 'Ajuste por rotura');
    console.log(`✅ ${variants[6].name} - 5 movimientos creados`);
    createdCount += 5;

    // Producto 7 - Serie de movimientos
    await createMovement(variants[7], 'restock', 120, 'Stock inicial', 'Lote REC-002');
    await createMovement(variants[7], 'sale', -25, 'Venta mayorista', 'Orden #12350');
    await createMovement(variants[7], 'sale', -15, 'Venta', 'Orden #12351');
    await createMovement(variants[7], 'restock', 50, 'Reabastecimiento', 'Nuevo lote');
    console.log(`✅ ${variants[7].name} - 4 movimientos creados`);
    createdCount += 4;

    // Resumen
    console.log('\n' + '═'.repeat(100));
    console.log('📊 RESUMEN DE MOVIMIENTOS CREADOS');
    console.log('═'.repeat(100));
    console.log(`✅ Movimientos creados: ${createdCount}`);
    console.log('═'.repeat(100) + '\n');

    // Estadísticas por tipo
    const stats = {
      restock: await StockMovement.countDocuments({ type: 'restock' }),
      sale: await StockMovement.countDocuments({ type: 'sale' }),
      adjustment: await StockMovement.countDocuments({ type: 'adjustment' }),
      return: await StockMovement.countDocuments({ type: 'return' }),
      cancellation: await StockMovement.countDocuments({ type: 'cancellation' }),
    };

    console.log('📈 ESTADÍSTICAS POR TIPO:');
    console.log(`   📦 Restock: ${stats.restock}`);
    console.log(`   💰 Ventas: ${stats.sale}`);
    console.log(`   🔧 Ajustes: ${stats.adjustment}`);
    console.log(`   ↩️  Devoluciones: ${stats.return}`);
    console.log(`   ❌ Cancelaciones: ${stats.cancellation}\n`);

    // Mostrar stock actual de productos con movimientos
    console.log('═'.repeat(100));
    console.log('📦 STOCK ACTUAL DE PRODUCTOS CON MOVIMIENTOS');
    console.log('═'.repeat(100));
    console.log('');

    const variantsWithMovements = await ProductVariant.find({
      _id: { $in: variants.map((v: any) => v._id) }
    });

    for (const variant of variantsWithMovements) {
      const movementCount = await StockMovement.countDocuments({ variant: variant._id });
      if (movementCount > 0) {
        const name = variant.name.substring(0, 50).padEnd(50, ' ');
        const stock = `Stock: ${variant.stock}`.padEnd(15, ' ');
        const movements = `Movimientos: ${movementCount}`;
        console.log(`   ${name} | ${stock} | ${movements}`);
      }
    }

    console.log('\n' + '═'.repeat(100) + '\n');

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
  seedStockMovements();
}

export default seedStockMovements;
