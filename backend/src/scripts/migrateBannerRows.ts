import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from '../models/Banner';

dotenv.config();

/**
 * Migración: asigna franjas (rowOrder / cols / mobileMode) a los banners de
 * mosaico existentes, derivándolas del `size` legacy.
 *
 * Regla de empaquetado (por placement, recorriendo en el orden actual):
 *  - wide / tall / hero  → franja propia full-width (cols=1).
 *  - normal              → se agrupan de a 4 en una franja (cols = cuántos cayeron).
 *
 * `order` se reescribe como la posición DENTRO de la franja (0-based).
 * `mobileMode` queda en 'stack' (default).
 *
 * Es determinística: re-ejecutarla recalcula lo mismo desde `size`/orden actual,
 * por lo que es idempotente. No toca home_hero (carrusel) ni category/collection.
 */

const MOSAIC_PLACEMENTS = ['home_promo', 'home_secondary'] as const;
const FULL_WIDTH_SIZES = new Set(['wide', 'tall', 'hero']);
const MAX_COLS = 4;

async function migrateBannerRows() {
  try {
    console.log('🔄 Migrando banners de mosaico a franjas...\n');

    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    let totalUpdated = 0;

    for (const placement of MOSAIC_PLACEMENTS) {
      const banners = await Banner.find({ placement }).sort({ order: 1, createdAt: 1 });
      if (banners.length === 0) {
        console.log(`· ${placement}: sin banners`);
        continue;
      }

      let rowOrder = 0;
      let i = 0;
      while (i < banners.length) {
        const b = banners[i];

        if (FULL_WIDTH_SIZES.has(b.size)) {
          // Franja propia full-width
          b.rowOrder = rowOrder;
          b.cols = 1;
          b.order = 0;
          b.mobileMode = b.mobileMode || 'stack';
          await b.save();
          totalUpdated++;
          rowOrder++;
          i++;
          continue;
        }

        // Agrupar normales consecutivos de a MAX_COLS
        const group = [];
        while (i < banners.length && !FULL_WIDTH_SIZES.has(banners[i].size) && group.length < MAX_COLS) {
          group.push(banners[i]);
          i++;
        }
        const cols = group.length as 1 | 2 | 3 | 4;
        for (let j = 0; j < group.length; j++) {
          const g = group[j];
          g.rowOrder = rowOrder;
          g.cols = cols;
          g.order = j;
          g.mobileMode = g.mobileMode || 'stack';
          await g.save();
          totalUpdated++;
        }
        rowOrder++;
      }

      console.log(`✅ ${placement}: ${banners.length} banner(s) en ${rowOrder} franja(s)`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 ${totalUpdated} banner(s) migrado(s) a franjas`);
    console.log('═'.repeat(60) + '\n');
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
  migrateBannerRows();
}

export default migrateBannerRows;
