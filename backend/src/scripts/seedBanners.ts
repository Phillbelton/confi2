import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from '../models/Banner';

dotenv.config();

/**
 * Seed de 3 banners promocionales para la sección "Promociones" del home
 * (placement=home_promo). Layout en desktop: 1 banner wide (2 columnas) +
 * 2 banners normales (1 columna cada uno) = 4 columnas en una fila.
 *
 * Usa placeholders externos de placehold.co — se reemplazan por imágenes
 * reales editando cada banner desde /admin/banners.
 */

interface BannerSeed {
  title: string;
  subtitle?: string;
  ctaText?: string;
  size: 'normal' | 'wide';
  order: number;
  image: string;
  imageMobile?: string;
}

const bannersToSeed: BannerSeed[] = [
  {
    title: 'Compra por mayor',
    subtitle: 'Descuentos automáticos por volumen',
    ctaText: 'Ver ofertas',
    size: 'wide',
    order: 1,
    // 16:6 desktop, 5:3 mobile — placehold.co genera el aspect ratio pedido
    image:
      'https://placehold.co/1600x600/ec4899/ffffff/webp?text=Compra+por+Mayor&font=playfair',
    imageMobile:
      'https://placehold.co/800x480/ec4899/ffffff/webp?text=Compra+por+Mayor&font=playfair',
  },
  {
    title: 'Novedades',
    subtitle: 'Lo último en el catálogo',
    ctaText: 'Descubrir',
    size: 'normal',
    order: 2,
    image:
      'https://placehold.co/800x480/22c55e/ffffff/webp?text=Novedades&font=playfair',
  },
  {
    title: 'Combos para fiestas',
    subtitle: 'Packs ideales para compartir',
    ctaText: 'Ver combos',
    size: 'normal',
    order: 3,
    image:
      'https://placehold.co/800x480/8b5cf6/ffffff/webp?text=Combos&font=playfair',
  },
];

async function seedBanners() {
  try {
    console.log('🔄 Iniciando seed de banners home_promo...\n');

    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question(
        '¿Eliminar los banners home_promo existentes antes de crear los nuevos? (s/n): ',
        resolve
      );
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      const r = await Banner.deleteMany({ placement: 'home_promo' });
      console.log(`\n🗑️  ${r.deletedCount} banner(s) home_promo eliminado(s)\n`);
    }

    let created = 0;
    for (const seed of bannersToSeed) {
      const b = await Banner.create({
        placement: 'home_promo',
        size: seed.size,
        order: seed.order,
        image: seed.image,
        imageMobile: seed.imageMobile,
        title: seed.title,
        subtitle: seed.subtitle,
        ctaText: seed.ctaText,
        link: { type: 'none' },
        active: true,
      });
      console.log(`✅ "${b.title}" creado · size=${b.size} · order=${b.order}`);
      created++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 ${created} banner(s) creado(s) en placement=home_promo`);
    console.log('═'.repeat(60));
    console.log('\nEditá cada banner desde /admin/banners para:');
    console.log('  • subir imágenes propias (reemplaza los placeholders)');
    console.log('  • cambiar el link (categoría/colección/producto/externo)');
    console.log('  • ajustar texto, fechas de campaña, etc.\n');
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
  seedBanners();
}

export default seedBanners;
