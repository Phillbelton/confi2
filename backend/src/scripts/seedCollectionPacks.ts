import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Collection from '../models/Collection';
import Product from '../models/Product';

dotenv.config();

/**
 * Seed de los 6 "packs" de colección de la home, con su imagen de marca.
 *
 * - Copia los PNG on-brand desde `backend/seed-assets/collections/` al
 *   `UPLOAD_DIR` (servido por el backend en `/uploads`), y asigna ese path
 *   al campo `image` de cada colección.
 * - Idempotente y NO destructivo: hace upsert por slug, preserva los productos
 *   de colecciones que ya los tienen (ej. Combo Cumpleaños), y NO toca ninguna
 *   colección fuera de esta lista (ej. la del usuario "Coocacooola").
 * - Las imágenes se generan con `node tools/genCollectionImages.mjs`.
 *
 * Correr en local:  npm run seed:collection-packs
 * Correr en la VM:  docker compose exec backend node dist/scripts/seedCollectionPacks.js
 */

interface Pack {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  gradient: string;
  order: number;
  /** Heurística por nombre de producto para poblar el pack (catálogo es-CL). */
  match?: RegExp;
  target: number;
}

const PACKS: Pack[] = [
  {
    slug: 'combo-cumpleanos',
    name: 'Combo Cumpleaños',
    description: 'Todo para festejar: dulces, snacks y sorpresas en un solo pack.',
    emoji: '🎂',
    gradient: 'from-pink-400 to-rose-500',
    order: 1,
    target: 8,
  },
  {
    slug: 'para-compartir',
    name: 'Para Compartir',
    description: 'Bandejas y formatos grandes, ideales para reuniones.',
    emoji: '🎉',
    gradient: 'from-orange-400 to-red-500',
    order: 2,
    match: /SURTID|BANDEJA|BALDE|PI[ÑN]ATA|BOLSA|1500UNI|1600UNI|X40|X60|X80/i,
    target: 8,
  },
  {
    slug: 'snacks-cinefilos',
    name: 'Snacks Cinéfilos',
    description: 'Cabritas y picoteo para tu maratón de películas.',
    emoji: '🎬',
    gradient: 'from-amber-400 to-orange-600',
    order: 3,
    match: /CABRITA|PALOMITO|GROSSO|MAN[IÍ]|PAPAS|RAMITA|CHIP/i,
    target: 8,
  },
  {
    slug: 'antojo-nocturno',
    name: 'Antojo Nocturno',
    description: 'Chocolate, trufas y cuchuflí para la noche.',
    emoji: '🌙',
    gradient: 'from-violet-500 to-purple-700',
    order: 4,
    match: /CHOC|TRUFA|CUCHUFL|BOMBON|MANJAR|CALUGA|CUBANITO|TABLETON|PALITO/i,
    target: 8,
  },
  {
    slug: 'picoteo-oficina',
    name: 'Picoteo Oficina',
    description: 'Galletas y dulces individuales para la jornada.',
    emoji: '💼',
    gradient: 'from-sky-400 to-blue-600',
    order: 5,
    match: /GALLETA|MERENGU|VAINA|MOSTACILLA|COCADA|BASTON|DELICIA/i,
    target: 8,
  },
  {
    slug: 'bebidas-frias',
    name: 'Bebidas Frías',
    description: 'Bebidas, aguas y jugos bien helados.',
    emoji: '🥤',
    gradient: 'from-cyan-400 to-teal-600',
    order: 6,
    match: /BEBIDA|AGUA|JUGO|GASEOSA|MONSTER|ENERGY|KAPO|BIDON/i,
    target: 8,
  },
];

const ASSETS_DIR = path.join(__dirname, '..', '..', 'seed-assets', 'collections');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const DEST_DIR = path.join(UPLOAD_DIR, 'collections');

async function pickProducts(pack: Pack, minimum = 4): Promise<mongoose.Types.ObjectId[]> {
  let docs: { _id: mongoose.Types.ObjectId }[] = [];

  if (pack.match) {
    docs = await Product.find({ active: true, name: { $regex: pack.match } })
      .select('_id')
      .limit(pack.target)
      .lean<{ _id: mongoose.Types.ObjectId }[]>();
  }

  if (docs.length < minimum) {
    const need = pack.target - docs.length;
    const extra = await Product.aggregate<{ _id: mongoose.Types.ObjectId }>([
      { $match: { active: true, _id: { $nin: docs.map((d) => d._id) } } },
      { $sample: { size: need } },
      { $project: { _id: 1 } },
    ]);
    docs = docs.concat(extra);
  }

  return docs.map((d) => d._id);
}

async function seedCollectionPacks() {
  try {
    console.log('🔄 Seed de packs de colección (con imágenes de marca)...\n');

    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    fs.mkdirSync(DEST_DIR, { recursive: true });

    let created = 0;
    let updated = 0;

    for (const pack of PACKS) {
      // 1) Copiar el asset de marca al UPLOAD_DIR
      const src = path.join(ASSETS_DIR, `${pack.slug}.png`);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(DEST_DIR, `${pack.slug}.png`));
      } else {
        console.warn(`⚠️  falta el asset ${pack.slug}.png — corré genCollectionImages.mjs primero`);
      }
      const image = `/uploads/collections/${pack.slug}.png`;

      // 2) Upsert de la colección por slug (o por nombre, retro-compat)
      const existing =
        (await Collection.findOne({ slug: pack.slug })) ||
        (await Collection.findOne({ name: pack.name }));

      if (existing) {
        const oldImage = existing.image;
        existing.name = pack.name;
        existing.description = pack.description;
        existing.emoji = pack.emoji;
        existing.gradient = pack.gradient;
        existing.image = image;
        existing.order = pack.order;
        existing.showOnHome = true;
        existing.active = true;
        // Preservar productos curados; solo poblar si está vacía
        if (!existing.products || existing.products.length === 0) {
          existing.products = await pickProducts(pack);
        }
        await existing.save();
        updated++;
        console.log(
          `🔄 "${pack.name}" — imagen actualizada (${existing.products.length} productos)` +
            (oldImage ? `\n     img previa: ${oldImage}` : '')
        );
      } else {
        const products = await pickProducts(pack);
        const c = await Collection.create({
          name: pack.name,
          description: pack.description,
          emoji: pack.emoji,
          gradient: pack.gradient,
          image,
          order: pack.order,
          showOnHome: true,
          active: true,
          products,
        });
        created++;
        console.log(`✅ "${c.name}" creada (${products.length} productos) — slug: ${c.slug}`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 ${created} creadas · ${updated} actualizadas`);
    console.log('═'.repeat(60));

    const home = await Collection.find({ showOnHome: true, active: true })
      .sort({ order: 1, name: 1 })
      .select('name slug order image products');
    console.log('\nColecciones visibles en la home:');
    home.forEach((c, i) => {
      const tag = PACKS.some((p) => p.slug === c.slug) ? '  (pack)' : '  (tuya — sin tocar)';
      console.log(
        `${(i + 1).toString().padStart(2, ' ')}. ${c.name.padEnd(22, ' ')} | order:${c.order} | ${c.products.length} prod${tag}`
      );
    });
    console.log('');
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
  seedCollectionPacks();
}

export default seedCollectionPacks;
