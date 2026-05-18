/**
 * Limpia URLs apuntando a res.cloudinary.com de Collection/Product/Category/Brand.
 * Las reemplaza por null/[] para que el frontend caiga al fallback (gradient/emoji/placeholder)
 * hasta que el admin re-suba las imágenes con storage local.
 *
 * Uso: ts-node backend/scripts/clean-cloudinary-urls.ts
 * O:   npx tsx scripts/clean-cloudinary-urls.ts   (desde backend/)
 */
import mongoose from 'mongoose';
import { ENV } from '../src/config/env';
import Collection from '../src/models/Collection';
import Product from '../src/models/Product';
import { Category } from '../src/models/Category';
import { Brand } from '../src/models/Brand';

const isCloudinary = (url?: string) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

async function main() {
  await mongoose.connect(ENV.MONGODB_URI);
  console.log('Connected. Cleaning Cloudinary URLs…');

  // Collection.image
  const colls = await Collection.find({ image: { $regex: 'res.cloudinary.com' } });
  for (const c of colls) {
    console.log(`  collection: ${c.name} → image cleared`);
    c.image = undefined as any;
    await c.save();
  }

  // Category.image
  const cats = await Category.find({ image: { $regex: 'res.cloudinary.com' } });
  for (const c of cats) {
    console.log(`  category: ${c.name} → image cleared`);
    (c as any).image = undefined;
    await c.save();
  }

  // Brand.logo
  const brands = await Brand.find({ logo: { $regex: 'res.cloudinary.com' } });
  for (const b of brands) {
    console.log(`  brand: ${b.name} → logo cleared`);
    (b as any).logo = undefined;
    await b.save();
  }

  // Product.images (array)
  const prods = await Product.find({ images: { $regex: 'res.cloudinary.com' } });
  for (const p of prods) {
    const before = p.images.length;
    p.images = p.images.filter((u) => !isCloudinary(u));
    if (p.images.length !== before) {
      console.log(`  product: ${p.name} → ${before - p.images.length} imagen(es) Cloudinary removida(s)`);
      await p.save();
    }
  }

  console.log('\n✅ Done.');
  console.log(`   ${colls.length} colecciones, ${cats.length} categorías, ${brands.length} marcas, ${prods.length} productos limpiados.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
