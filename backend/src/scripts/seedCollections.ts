import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Collection from '../models/Collection';
import ProductParent from '../models/ProductParent';

dotenv.config();

interface CollectionSeed {
  name: string;
  description?: string;
  emoji?: string;
  gradient?: string;
  productPickStrategy: 'random' | 'first' | 'featured';
  productCount: number;
  showOnHome?: boolean;
  order?: number;
}

const collectionsToSeed: CollectionSeed[] = [
  {
    name: 'Combo Cumpleaños',
    description: 'Lo que no puede faltar en una fiesta — golosinas, snacks y bebidas',
    emoji: '🎂',
    gradient: 'from-pink-400 to-rose-500',
    productPickStrategy: 'random',
    productCount: 6,
    showOnHome: true,
    order: 1,
  },
  {
    name: 'Snacks Cinéfilos',
    description: 'Para acompañar tu maratón de películas',
    emoji: '🎬',
    gradient: 'from-amber-400 to-orange-600',
    productPickStrategy: 'random',
    productCount: 5,
    showOnHome: true,
    order: 2,
  },
  {
    name: 'Picoteo Oficina',
    description: 'Sobreviví la jornada laboral con energía dulce',
    emoji: '💼',
    gradient: 'from-blue-400 to-cyan-500',
    productPickStrategy: 'random',
    productCount: 4,
    showOnHome: true,
    order: 3,
  },
  {
    name: 'Antojo Nocturno',
    description: 'Los favoritos para cuando ataca el hambre nocturna',
    emoji: '🌙',
    gradient: 'from-indigo-500 to-purple-600',
    productPickStrategy: 'random',
    productCount: 5,
    showOnHome: true,
    order: 4,
  },
  {
    name: 'Sin Culpa',
    description: 'Opciones más livianas para los que cuidan la línea',
    emoji: '🥗',
    gradient: 'from-green-400 to-emerald-500',
    productPickStrategy: 'random',
    productCount: 4,
    showOnHome: true,
    order: 5,
  },
  {
    name: 'Para Compartir',
    description: 'Packs grandes ideales para reuniones y celebraciones',
    emoji: '🎉',
    gradient: 'from-red-400 to-pink-500',
    productPickStrategy: 'featured',
    productCount: 6,
    showOnHome: true,
    order: 6,
  },
  {
    name: 'Esenciales del Mes',
    description: 'Los más vendidos por la comunidad Quelita',
    emoji: '⭐',
    gradient: 'from-yellow-400 to-amber-500',
    productPickStrategy: 'featured',
    productCount: 6,
    showOnHome: true,
    order: 7,
  },
  {
    name: 'Bebidas Frías',
    description: 'Refrescate con nuestras gaseosas y jugos',
    emoji: '🥤',
    gradient: 'from-cyan-400 to-blue-500',
    productPickStrategy: 'random',
    productCount: 4,
    showOnHome: true,
    order: 8,
  },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

async function seedCollections() {
  try {
    console.log('🔄 Iniciando seed de colecciones...\n');

    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI no está configurada');

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question(
        '¿Eliminar todas las colecciones existentes antes de crear las nuevas? (s/n): ',
        resolve
      );
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      const r = await Collection.deleteMany({});
      console.log(`\n🗑️  ${r.deletedCount} colecciones eliminadas\n`);
    }

    // Cargar productos disponibles para asignar
    const allProducts = await ProductParent.find({ active: true }).select('_id name featured').lean();
    const featuredProducts = allProducts.filter((p) => p.featured);

    if (allProducts.length === 0) {
      console.error('❌ No hay productos activos en la base. Ejecutá seedProducts primero.');
      process.exit(1);
    }

    let created = 0;
    let updated = 0;

    for (const seed of collectionsToSeed) {
      let pickedProducts: { _id: any }[] = [];

      switch (seed.productPickStrategy) {
        case 'random':
          pickedProducts = pickRandom(allProducts, seed.productCount);
          break;
        case 'featured':
          pickedProducts = pickRandom(
            featuredProducts.length > 0 ? featuredProducts : allProducts,
            seed.productCount
          );
          break;
        case 'first':
          pickedProducts = allProducts.slice(0, seed.productCount);
          break;
      }

      const productIds = pickedProducts.map((p) => p._id);
      const existing = await Collection.findOne({ name: seed.name });

      if (existing) {
        existing.description = seed.description;
        existing.emoji = seed.emoji;
        existing.gradient = seed.gradient;
        existing.products = productIds;
        existing.showOnHome = seed.showOnHome ?? true;
        existing.order = seed.order ?? 0;
        existing.active = true;
        await existing.save();
        console.log(`🔄 "${seed.name}" actualizada (${productIds.length} productos)`);
        updated++;
      } else {
        const c = await Collection.create({
          name: seed.name,
          description: seed.description,
          emoji: seed.emoji,
          gradient: seed.gradient,
          products: productIds,
          active: true,
          showOnHome: seed.showOnHome ?? true,
          order: seed.order ?? 0,
        });
        console.log(`✅ "${c.name}" creada (${productIds.length} productos) — slug: ${c.slug}`);
        created++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN');
    console.log('═'.repeat(60));
    console.log(`✅ Creadas: ${created}`);
    console.log(`🔄 Actualizadas: ${updated}`);
    console.log('═'.repeat(60) + '\n');

    const all = await Collection.find({}).sort({ order: 1, name: 1 });
    all.forEach((c, i) => {
      console.log(
        `${(i + 1).toString().padStart(2, ' ')}. ${c.emoji ?? '📦'}  ${c.name.padEnd(28, ' ')} | ${c.products.length} productos | home:${c.showOnHome ? '✅' : '❌'} | slug:${c.slug}`
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
  seedCollections();
}

export default seedCollections;
