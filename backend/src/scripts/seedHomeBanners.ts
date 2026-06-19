import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Banner from '../models/Banner';

dotenv.config();

/**
 * Seed de los banners/promos REALES de la home (los que se curaron en /admin).
 *
 * Reproduce los 6 banners activos del home en dev: 2 heroes, la huincha de
 * "Compra por mayor", 2 promos (Novedades / Combos) y la huincha de horario.
 * Copia los PNG de marca desde `backend/seed-assets/banners/` al `UPLOAD_DIR`
 * (servido en `/uploads`) y hace upsert por (placement + title).
 *
 * Idempotente y NO destructivo: solo toca los 6 banders de esta lista
 * (match por placement+title). No borra otros banners (ej. pruebas inactivas)
 * ni otros placements (category_top, collection_top).
 *
 * Flags:  --dry-run  → copia assets y reporta qué haría, sin escribir en la DB.
 *
 * Correr en local:  npm run seed:home-banners
 * Correr en la VM:  docker compose exec backend node dist/scripts/seedHomeBanners.js
 */

type LinkType = 'collection' | 'product' | 'category' | 'external' | 'none';

interface BannerSeed {
  placement: 'home_hero' | 'home_promo' | 'home_secondary';
  order: number;
  rowOrder: number;
  cols: 1 | 2 | 3 | 4;
  mobileMode: 'stack' | 'scroll';
  size: 'normal' | 'wide' | 'tall' | 'hero';
  active: boolean;
  title: string;
  subtitle?: string;
  ctaText?: string;
  link: { type: LinkType; target?: string };
  asset: string;
  assetMobile?: string;
}

const BANNERS: BannerSeed[] = [
  // ── Hero (carrusel principal) ──
  {
    placement: 'home_hero', order: 0, rowOrder: 0, cols: 1, mobileMode: 'stack',
    size: 'normal', active: true,
    title: 'Bienvenidos a nuestra confitería',
    subtitle: 'Dulces y sorpresas con cariño',
    link: { type: 'none' },
    asset: 'hero-turquesa-1920x364.png',
    assetMobile: 'hero-turquesa-mobile-700x330.png',
  },
  {
    placement: 'home_hero', order: 1, rowOrder: 0, cols: 1, mobileMode: 'stack',
    size: 'normal', active: true,
    title: 'Ofertas de la semana',
    subtitle: 'Descuentos en tus dulces favoritos',
    ctaText: 'Ver ofertas',
    link: { type: 'external', target: '/productos?onSale=true' },
    asset: 'hero-magenta-1920x364.png',
  },
  // ── Promos (mosaico) ──
  {
    placement: 'home_promo', order: 0, rowOrder: 0, cols: 1, mobileMode: 'scroll',
    size: 'wide', active: true,
    title: 'Compra por mayor',
    subtitle: 'Descuentos automáticos por volumen',
    ctaText: 'Ver ofertas',
    link: { type: 'none' },
    asset: 'huincha-petroleo-2752x256.png',
  },
  {
    placement: 'home_promo', order: 0, rowOrder: 1, cols: 2, mobileMode: 'scroll',
    size: 'normal', active: true,
    title: 'Novedades',
    subtitle: 'Lo último en el catálogo',
    ctaText: 'Descubrir',
    link: { type: 'category', target: 'obleas' },
    asset: 'promo-turquesa-1200x600.png',
  },
  {
    placement: 'home_promo', order: 1, rowOrder: 1, cols: 2, mobileMode: 'scroll',
    size: 'normal', active: true,
    title: 'Combos para fiestas',
    subtitle: 'Packs ideales para compartir',
    ctaText: 'Ver combos',
    link: { type: 'none' },
    asset: 'promo-magenta-1200x600.png',
  },
  // ── Secundario (huincha de horario) ──
  {
    placement: 'home_secondary', order: 0, rowOrder: 0, cols: 1, mobileMode: 'stack',
    size: 'normal', active: true,
    title: 'Lunes a sábado · 08:30 a 20:30',
    subtitle: 'Horario de atención',
    link: { type: 'none' },
    asset: 'huincha-crema-2752x256.png',
  },
];

const DRY_RUN = process.argv.includes('--dry-run');
const ASSETS_DIR = path.join(__dirname, '..', '..', 'seed-assets', 'banners');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const DEST_DIR = path.join(UPLOAD_DIR, 'banners');

async function seedHomeBanners() {
  try {
    console.log(`🔄 Seed de banners de la home${DRY_RUN ? ' [DRY-RUN]' : ''}...\n`);

    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    fs.mkdirSync(DEST_DIR, { recursive: true });

    let created = 0;
    let updated = 0;

    for (const b of BANNERS) {
      // 1) Copiar asset(s) de marca al UPLOAD_DIR
      for (const file of [b.asset, b.assetMobile].filter(Boolean) as string[]) {
        const src = path.join(ASSETS_DIR, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(DEST_DIR, file));
        } else {
          console.warn(`⚠️  falta el asset ${file}`);
        }
      }

      const image = `/uploads/banners/${b.asset}`;
      const imageMobile = b.assetMobile ? `/uploads/banners/${b.assetMobile}` : undefined;

      const existing = await Banner.findOne({ placement: b.placement, title: b.title });

      if (DRY_RUN) {
        console.log(`${existing ? '↻ update' : '＋ create'}  [${b.placement}] "${b.title}"  → ${image}`);
        if (existing) updated++; else created++;
        continue;
      }

      if (existing) {
        existing.order = b.order;
        existing.rowOrder = b.rowOrder;
        existing.cols = b.cols;
        existing.mobileMode = b.mobileMode;
        existing.size = b.size;
        existing.active = b.active;
        existing.subtitle = b.subtitle;
        existing.ctaText = b.ctaText;
        existing.link = b.link as any;
        existing.image = image;
        existing.imageMobile = imageMobile;
        existing.startDate = undefined;
        existing.endDate = undefined;
        await existing.save();
        updated++;
        console.log(`↻ "${b.title}" actualizado [${b.placement}]`);
      } else {
        await Banner.create({
          placement: b.placement,
          order: b.order,
          rowOrder: b.rowOrder,
          cols: b.cols,
          mobileMode: b.mobileMode,
          size: b.size,
          active: b.active,
          title: b.title,
          subtitle: b.subtitle,
          ctaText: b.ctaText,
          link: b.link,
          image,
          imageMobile,
        });
        created++;
        console.log(`＋ "${b.title}" creado [${b.placement}]`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 ${created} creados · ${updated} actualizados${DRY_RUN ? ' (simulado)' : ''}`);
    console.log('═'.repeat(60));

    const home = await Banner.find({ placement: { $in: ['home_hero', 'home_promo', 'home_secondary'] } })
      .sort({ placement: 1, rowOrder: 1, order: 1 })
      .select('placement title active image');
    console.log('\nBanners en placements de la home:');
    home.forEach((x) => {
      const mine = BANNERS.some((s) => s.placement === x.placement && s.title === x.title);
      console.log(
        `  ${x.active ? '🟢' : '⚪'} [${x.placement.padEnd(14)}] ${(x.title || '(sin título)').padEnd(34)} ${mine ? '(seed)' : '(otro — sin tocar)'}`
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
  seedHomeBanners();
}

export default seedHomeBanners;
