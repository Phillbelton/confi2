import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import AuditLog from '../models/AuditLog';

dotenv.config();

/**
 * Migración de índices — Mayo 2026
 *
 * Limpia índices que quedaron superseded por compuestos más completos,
 * y permite que mongoose recree el de auditlogs con TTL.
 *
 * **Orden seguro de operación:**
 *  1. Deploy del backend con los schemas actualizados → mongoose autoindex
 *     crea los nuevos índices compuestos en boot (no hay conflicto, son
 *     keys nuevas).
 *  2. Verificar en Atlas que los nuevos índices están "Building..." → ready.
 *  3. Correr este script: `npm run migrate:indexes` desde /backend.
 *  4. Restart del backend → mongoose detecta que falta el TTL en auditlogs
 *     y lo crea con la nueva definición.
 *
 * **Qué dropea:**
 *  - `products.categories_1_active_1`           (reemplazado por compuesto
 *                                                con createdAt al final).
 *  - `orders.customer.user_1`                   (reemplazado por compuesto
 *                                                con createdAt al final).
 *  - `auditlogs.createdAt_-1` (sin TTL)         (mongoose lo recrea con
 *                                                expireAfterSeconds en el
 *                                                próximo boot).
 *
 * **Idempotente.** Si un índice ya fue dropeado, se loggea y sigue.
 * **Reversible.** Los índices se pueden recrear restaurando los schemas.
 *
 * Uso: npm run migrate:indexes  (desde /backend)
 */

interface DropTarget {
  collectionName: string;
  indexName: string;
  reason: string;
}

const TARGETS: DropTarget[] = [
  {
    collectionName: Product.collection.name, // 'products'
    indexName: 'categories_1_active_1',
    reason: 'Superseded por categories_1_active_1_createdAt_-1 (sort sin in-memory)',
  },
  {
    collectionName: Order.collection.name, // 'orders'
    indexName: 'customer.user_1',
    reason: 'Superseded por customer.user_1_createdAt_-1 (sort sin in-memory)',
  },
  {
    collectionName: AuditLog.collection.name, // 'auditlogs'
    indexName: 'createdAt_-1',
    reason: 'Recreado por mongoose con TTL expireAfterSeconds=180d en próximo boot',
  },
];

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI no está configurada');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB\n');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ No se pudo obtener handle de la DB');
    process.exit(1);
  }

  let dropped = 0;
  let skipped = 0;
  let errored = 0;

  for (const target of TARGETS) {
    const coll = db.collection(target.collectionName);
    try {
      const indexes = await coll.indexes();
      const exists = indexes.some((i) => i.name === target.indexName);

      if (!exists) {
        console.log(`⏭️  ${target.collectionName}.${target.indexName} — ya no existe, skip`);
        skipped += 1;
        continue;
      }

      await coll.dropIndex(target.indexName);
      console.log(`✅ ${target.collectionName}.${target.indexName} — dropped`);
      console.log(`   → ${target.reason}\n`);
      dropped += 1;
    } catch (err) {
      console.error(`❌ ${target.collectionName}.${target.indexName} — error:`, err instanceof Error ? err.message : err);
      errored += 1;
    }
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`Resumen: ${dropped} dropped, ${skipped} skipped, ${errored} errored`);
  console.log('──────────────────────────────────────────\n');

  if (errored > 0) {
    console.log('⚠️  Hubo errores. Revisar arriba.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('Próximos pasos:');
  console.log('  1. Reiniciar el backend (npm run dev / restart container).');
  console.log('  2. Verificar en Atlas que el índice auditlogs.createdAt_-1 reaparezca');
  console.log('     con TTL (campo `expireAfterSeconds` = 15552000).');
  console.log('  3. Listo. Los nuevos compuestos ya están activos desde el deploy anterior.\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migración falló:', err);
  process.exit(1);
});
