import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Category } from '../models/Category';

dotenv.config();

/**
 * Seed de las imágenes de marca de las 7 categorías raíz.
 *
 * Copia los PNG generados por `tools/genCategoryBanners.mjs` desde
 * `backend/seed-assets/categories/` al UPLOAD_DIR (servido en /uploads) y
 * asigna en cada categoría raíz:
 *   - bannerImage        (<slug>-banner.png,        1600×500 — hero desktop)
 *   - bannerImageMobile  (<slug>-banner-mobile.png,  800×400 — hero mobile)
 *   - image              (<slug>-thumb.png,          800×800 — miniatura)
 *
 * Idempotente y NO destructivo: por defecto solo asigna campos VACÍOS —
 * nunca pisa una imagen que el admin ya subió. Con `--force` reasigna todo.
 *
 * Las categorías se buscan por slug exacto y, si no, por regex de nombre
 * (tolera slugs con sufijo -timestamp o acentos distintos).
 *
 * Flags:
 *   --dry-run  → copia assets y reporta qué haría, sin escribir en la DB.
 *   --force    → sobreescribe también los campos que ya tienen imagen.
 *
 * Correr en local:  npm run seed:category-banners
 * Correr en la VM:  docker compose exec backend node dist/scripts/seedCategoryBanners.js
 */

interface CategorySeed {
  slug: string;
  nameRegex: RegExp;
}

const ROOTS: CategorySeed[] = [
  { slug: 'confiteria',         nameRegex: /confiter/i },
  { slug: 'chocolateria',       nameRegex: /chocolater/i },
  { slug: 'heladeria',          nameRegex: /helader/i },
  { slug: 'bebidas-y-liquidos', nameRegex: /bebidas/i },
  { slug: 'cumpleanos',         nameRegex: /cumplea/i },
  { slug: 'reposteria',         nameRegex: /reposter/i },
  { slug: 'snacks-y-galletas',  nameRegex: /snacks/i },
];

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const ASSETS_DIR = path.join(__dirname, '..', '..', 'seed-assets', 'categories');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const DEST_DIR = path.join(UPLOAD_DIR, 'categories');

async function seedCategoryBanners() {
  try {
    console.log(
      `🔄 Seed de banners de categoría${DRY_RUN ? ' [DRY-RUN]' : ''}${FORCE ? ' [FORCE]' : ''}...\n`
    );

    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    fs.mkdirSync(DEST_DIR, { recursive: true });

    let updated = 0;
    let skipped = 0;
    let missing = 0;

    for (const seed of ROOTS) {
      // 1) Resolver la categoría raíz (slug exacto → regex de nombre)
      let cat = await Category.findOne({ slug: seed.slug, parent: null });
      if (!cat) cat = await Category.findOne({ name: seed.nameRegex, parent: null });
      if (!cat) {
        console.warn(`⚠️  categoría raíz no encontrada: ${seed.slug}`);
        missing++;
        continue;
      }

      // 2) Copiar los 3 assets al UPLOAD_DIR
      const files = {
        bannerImage: `${seed.slug}-banner.png`,
        bannerImageMobile: `${seed.slug}-banner-mobile.png`,
        image: `${seed.slug}-thumb.png`,
      } as const;

      let assetMissing = false;
      for (const file of Object.values(files)) {
        const src = path.join(ASSETS_DIR, file);
        if (!fs.existsSync(src)) {
          console.warn(`⚠️  falta el asset ${file} — corre "node tools/genCategoryBanners.mjs"`);
          assetMissing = true;
          break;
        }
        fs.copyFileSync(src, path.join(DEST_DIR, file));
      }
      if (assetMissing) {
        missing++;
        continue;
      }

      // 3) Asignar solo campos vacíos (o todos, con --force)
      const changes: string[] = [];
      for (const [field, file] of Object.entries(files) as Array<[keyof typeof files, string]>) {
        const current = cat[field];
        if (current && !FORCE) continue;
        const url = `/uploads/categories/${file}`;
        if (current === url) continue;
        (cat as any)[field] = url;
        changes.push(`${field}${current ? ' (pisado)' : ''}`);
      }

      if (changes.length === 0) {
        console.log(`•  "${cat.name}" ya tiene sus imágenes — sin cambios`);
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`↻ [dry-run] "${cat.name}" ← ${changes.join(', ')}`);
        updated++;
        continue;
      }

      await cat.save();
      updated++;
      console.log(`↻ "${cat.name}" ← ${changes.join(', ')}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log(
      `📊 ${updated} actualizadas · ${skipped} sin cambios · ${missing} no encontradas${DRY_RUN ? ' (simulado)' : ''}`
    );
    console.log('═'.repeat(60));

    const roots = await Category.find({ parent: null })
      .sort({ order: 1, name: 1 })
      .select('name slug image bannerImage bannerImageMobile active');
    console.log('\nCategorías raíz:');
    roots.forEach((c) => {
      const marks = [
        c.image ? 'thumb' : '·',
        c.bannerImage ? 'banner' : '·',
        c.bannerImageMobile ? 'mobile' : '·',
      ].join(' / ');
      console.log(`  ${c.active ? '🟢' : '⚪'} ${(c.name || '').padEnd(24)} [${marks}]`);
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
  seedCategoryBanners();
}

export default seedCategoryBanners;
