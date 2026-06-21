import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';

dotenv.config();

/**
 * Migración: backfill de `flavors[]` desde el `flavor` legacy. Cada producto con
 * `flavor` seteado y sin `flavors` recibe `flavors = [flavor]`.
 *
 * Idempotente: solo toca docs con `flavors` ausente/vacío y `flavor` presente.
 * Usa `bulkWrite` por `_id` (no corre hooks; el `flavor` legacy ya está bien,
 * solo agregamos el array espejo).
 *
 * Correr en local:  npm run migrate:flavors
 * Correr en la VM:  docker compose exec backend node dist/scripts/migrateFlavors.js
 */
async function migrateFlavors() {
  try {
    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    const filter = {
      flavor: { $exists: true, $ne: null },
      $or: [{ flavors: { $exists: false } }, { flavors: { $size: 0 } }],
    };
    const total = await Product.countDocuments(filter);
    console.log(`🔄 ${total} producto(s) con flavor y sin flavors[] → backfill...\n`);

    const cursor = Product.find(filter).select('flavor').lean().cursor();

    let ops: any[] = [];
    let migrated = 0;
    const flush = async () => {
      if (ops.length === 0) return;
      const r = await Product.bulkWrite(ops, { ordered: false });
      migrated += r.modifiedCount || 0;
      ops = [];
    };

    for await (const p of cursor as any) {
      ops.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { flavors: [p.flavor] } },
        },
      });
      if (ops.length >= 500) await flush();
    }
    await flush();

    const remaining = await Product.countDocuments(filter);
    console.log(`\n✅ ${migrated} producto(s) migrado(s). Pendientes: ${remaining}`);
  } catch (e: any) {
    console.error('❌ Error fatal:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  migrateFlavors();
}

export default migrateFlavors;
