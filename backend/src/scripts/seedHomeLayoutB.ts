import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { HomeLayout, HomeSection } from '../models/HomeLayout';
import { Category } from '../models/Category';
import Product from '../models/Product';

dotenv.config();

/**
 * Aplica el layout de home "mayorista primero" (propuesta B).
 *
 * Orden resultante:
 *   1. hero (partido: mayorista / detalle)
 *   2. category_grid — puerta de entrada al catálogo
 *   3. editorial_block — banner de una categoría + sus productos
 *   4. product_carousel "Lo más pedido" — reemplaza los 3 duplicados
 *   5. collections
 *   6. location_map
 *
 * Las secciones que la propuesta no usa (los carruseles duplicados, el CTA
 * estático y las dos banner_zone) NO se borran: quedan `active: false`, así
 * el cambio es reversible desde /admin/banners sin perder su configuración.
 *
 * Guarda un respaldo del layout anterior en `homelayouts_backup` para poder
 * volver atrás si no convence.
 *
 * Flags:
 *   --dry-run   → muestra el layout resultante sin escribir en la DB
 *   --restore   → restaura el último respaldo y sale
 *
 * Correr en local:  npm run seed:home-b
 * Correr en la VM:  docker compose exec backend node dist/scripts/seedHomeLayoutB.js
 */

const DRY_RUN = process.argv.includes('--dry-run');
const RESTORE = process.argv.includes('--restore');

const BACKUP_COLLECTION = 'homelayouts_backup';

/** Secciones que la propuesta B mantiene visibles, en orden. */
function buildActiveSections(opts: {
  editorialSlug?: string;
  editorialName?: string;
}): HomeSection[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      active: true,
      config: { heroLayout: 'split' },
    },
    // La escalera de precios (wholesale_ladder) queda DISPONIBLE como tipo de
    // sección pero fuera del layout: mostrar la tabla de tramos en la home
    // resultó fría y disuasoria. El diferencial mayorista se comunica en el
    // hero partido y en cada ficha de producto, donde el precio ya tiene
    // contexto de compra.
    {
      id: 'category_grid',
      type: 'category_grid',
      active: true,
      config: {
        title: 'Compra por categoría',
        ctaText: 'Ver catálogo completo',
        limit: 6,
      },
    },
    ...(opts.editorialSlug
      ? [
          {
            id: 'editorial_block',
            type: 'editorial_block' as const,
            active: true,
            config: {
              // Rota entre las categorías que califican (con arte y surtido).
              // El título y el enlace NO se fijan: se derivan de la categoría
              // sorteada en cada visita. categorySlug queda como respaldo.
              editorialMode: 'random' as const,
              categorySlug: opts.editorialSlug,
              kicker: 'Te puede interesar',
              limit: 4,
            },
          },
        ]
      : []),
    {
      id: 'most_wanted',
      type: 'product_carousel',
      active: true,
      config: {
        title: 'Lo más pedido',
        emoji: '🔥',
        source: 'popular',
        limit: 12,
      },
    },
    { id: 'collections', type: 'collections', active: true },
    // location_map y las secciones inactivas se agregan abajo desde el layout previo.
  ];
}

async function run() {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) throw new Error('MONGODB_URI no está configurada');
  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB\n');

  const db = mongoose.connection.db!;

  // ── Restaurar ──
  if (RESTORE) {
    const backup = await db
      .collection(BACKUP_COLLECTION)
      .find({})
      .sort({ savedAt: -1 })
      .limit(1)
      .toArray();
    if (backup.length === 0) {
      console.log('⚠️  No hay respaldo guardado — nada que restaurar.');
      return;
    }
    await HomeLayout.updateOne(
      { key: 'home' },
      { $set: { sections: backup[0].sections } },
      { upsert: true }
    );
    console.log(
      `↺ Layout restaurado desde el respaldo del ${new Date(backup[0].savedAt).toLocaleString('es-CL')}`
    );
    return;
  }

  const current = await HomeLayout.findOne({ key: 'home' }).lean();
  const previous: HomeSection[] = (current?.sections as HomeSection[]) ?? [];

  // ── Elegir la categoría del bloque editorial: raíz con más productos ──
  const roots = await Category.find({ parent: null, active: true }).select('name slug').lean();
  let editorial: { slug: string; name: string } | undefined;
  let best = 0;
  for (const r of roots) {
    const ids = await (Category as any).getDescendantIds(r._id);
    const n = await Product.countDocuments({ categories: { $in: ids }, active: true });
    if (n > best) {
      best = n;
      editorial = { slug: r.slug, name: r.name };
    }
  }
  if (editorial) {
    console.log(`🎨 Bloque editorial → ${editorial.name} (${best} productos)`);
  }

  // ── Armar el layout final ──
  const activeSections = buildActiveSections({
    editorialSlug: editorial?.slug,
    editorialName: editorial?.name,
  });
  const activeIds = new Set(activeSections.map((s) => s.id));
  const activeTypes = new Set(activeSections.map((s) => s.type));

  // El mapa de tiendas cierra la home: se conserva tal cual venía.
  const map = previous.find((s) => s.type === 'location_map');

  // Todo lo demás del layout previo se conserva DESACTIVADO (reversible):
  // los carruseles duplicados, el CTA estático y las 2 banner_zone —
  // el validador exige que esas secciones existan aunque estén ocultas.
  const parked = previous
    .filter(
      (s) =>
        !activeIds.has(s.id) &&
        s.type !== 'location_map' &&
        // evita duplicar singletons que la propuesta ya define (hero, collections)
        !(activeTypes.has(s.type) && ['hero', 'collections'].includes(s.type))
    )
    .map((s) => ({ ...s, active: false }));

  const sections: HomeSection[] = [
    ...activeSections,
    ...(map ? [map] : []),
    ...parked,
  ];

  console.log('\n── Layout resultante ──');
  sections.forEach((s, i) => {
    const cfg = s.config?.title ?? s.config?.categorySlug ?? s.config?.placement ?? '';
    console.log(
      `${String(i + 1).padStart(2)}. ${s.active ? '🟢' : '⚪'} ${s.type.padEnd(18)} ${cfg}`
    );
  });
  console.log(
    `\n${sections.filter((s) => s.active).length} visibles · ${sections.filter((s) => !s.active).length} ocultas (recuperables)`
  );

  if (DRY_RUN) {
    console.log('\n[DRY-RUN] No se escribió nada.');
    return;
  }

  // Respaldo antes de pisar
  if (previous.length > 0) {
    await db.collection(BACKUP_COLLECTION).insertOne({
      savedAt: new Date(),
      sections: previous,
      note: 'Respaldo automático antes de aplicar el layout B (mayorista primero)',
    });
    console.log('\n💾 Respaldo del layout anterior guardado.');
  }

  await HomeLayout.updateOne({ key: 'home' }, { $set: { sections } }, { upsert: true });
  console.log('✅ Layout "mayorista primero" aplicado.');
  console.log('   Para volver atrás:  npm run seed:home-b -- --restore');
}

run()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  });
