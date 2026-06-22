import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';

dotenv.config();

/**
 * Migración: backfill de `presentaciones[]` desde los campos legacy
 * (`saleUnit` + `unitPrice` + `tiers` + `fixedDiscount`). Cada producto sin
 * presentaciones recibe UNA presentación `principal` = su configuración actual.
 *
 * Idempotente: solo toca docs con `presentaciones` ausente o vacío. Usa
 * `bulkWrite` con `_id` explícito (no corre hooks; los campos legacy ya están
 * bien, solo agregamos el array espejo).
 *
 * Correr en local:  npm run migrate:presentations
 * Correr en la VM:  docker compose exec backend node dist/scripts/migratePresentations.js
 */
async function migratePresentations() {
  try {
    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    const filter = {
      $or: [{ presentaciones: { $exists: false } }, { presentaciones: { $size: 0 } }],
    };
    const total = await Product.countDocuments(filter);
    console.log(`🔄 ${total} producto(s) sin presentaciones → backfill...\n`);

    const cursor = Product.find(filter)
      .select('saleUnit unitPrice tiers fixedDiscount')
      .lean()
      .cursor();

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
          update: {
            $set: {
              presentaciones: [
                {
                  _id: new mongoose.Types.ObjectId(),
                  type: p.saleUnit?.type || 'unidad',
                  quantity: p.saleUnit?.quantity || 1,
                  unitPrice: p.unitPrice ?? 0,
                  tiers: p.tiers || [],
                  ...(p.fixedDiscount ? { fixedDiscount: p.fixedDiscount } : {}),
                  principal: true,
                },
              ],
            },
          },
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
  migratePresentations();
}

export default migratePresentations;
