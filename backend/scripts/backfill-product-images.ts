/**
 * Backfill: recorre todos los Product activos y crea ProductImage docs
 * para cada URL en `Product.images[]` que no exista todavía. Idempotente
 * gracias al índice único (sku, url).
 *
 * Uso (desde backend/):
 *   npx tsx scripts/backfill-product-images.ts
 *
 * Correr UNA SOLA VEZ después de mergear el cambio a `ProductImage`. Despues
 * de esto, todos los productos existentes están "protegidos" — un wipe +
 * re-import volverá a vincular automáticamente.
 */
import mongoose from 'mongoose';
import { ENV } from '../src/config/env';
import Product from '../src/models/Product';
import ProductImage from '../src/models/ProductImage';

async function main() {
  await mongoose.connect(ENV.MONGODB_URI);
  console.log('Connected. Backfilling ProductImage from Product.images[]…\n');

  const products = await Product.find(
    { sku: { $ne: null }, images: { $exists: true, $ne: [] } },
    { sku: 1, images: 1 }
  ).lean();

  console.log(`Productos con imágenes: ${products.length}`);

  let created = 0;
  let skipped = 0;
  for (const p of products) {
    if (!p.sku) continue;
    const imgs = p.images || [];
    for (let order = 0; order < imgs.length; order++) {
      const url = imgs[order];
      if (!url) continue;
      try {
        await ProductImage.create({ sku: p.sku, url, order });
        created++;
      } catch (e: any) {
        // Duplicate (sku+url unique) — ya estaba
        if (e.code === 11000) {
          skipped++;
        } else {
          console.warn(`  warn ${p.sku} [${order}]: ${e.message}`);
        }
      }
    }
  }

  console.log(`\n✅ Done.`);
  console.log(`   Creados: ${created}`);
  console.log(`   Ya existían: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
