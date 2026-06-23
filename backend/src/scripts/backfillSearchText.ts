import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';
import { normalizeForSearch } from '../utils/searchNormalize';

dotenv.config();

/**
 * Backfill de `searchText` (texto normalizado para el autocompletado del
 * buscador) sobre todos los productos.
 *
 * Necesario porque el hook pre-save solo corre en create/update vía Mongoose;
 * los productos cargados con `insertMany`/`bulkWrite` (importador de Excel) no
 * lo disparan y quedan sin `searchText`.
 *
 * Idempotente: recalcula desde `name` y solo escribe los que difieren, así que
 * se puede correr cuantas veces sea necesario (p. ej. después de cada import).
 *
 * Correr en local:  npm run backfill:search-text
 * Correr en la VM:  docker compose exec backend node dist/scripts/backfillSearchText.js
 */
async function backfillSearchText() {
  try {
    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    const total = await Product.countDocuments({});
    console.log(`🔄 Recalculando searchText de ${total} producto(s)...\n`);

    // `+searchText` porque el campo es select:false por defecto.
    const cursor = Product.find({}).select('name +searchText').lean().cursor();

    let ops: any[] = [];
    let updated = 0;
    const flush = async () => {
      if (ops.length === 0) return;
      const r = await Product.bulkWrite(ops, { ordered: false });
      updated += r.modifiedCount || 0;
      ops = [];
    };

    for await (const p of cursor as any) {
      const next = normalizeForSearch(p.name);
      if (next === p.searchText) continue; // ya está al día
      ops.push({
        updateOne: { filter: { _id: p._id }, update: { $set: { searchText: next } } },
      });
      if (ops.length >= 500) await flush();
    }
    await flush();

    console.log(`\n✅ ${updated} producto(s) actualizado(s).`);
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
  backfillSearchText();
}

export default backfillSearchText;
