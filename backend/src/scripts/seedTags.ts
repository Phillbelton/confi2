import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Tag } from '../models/Tag';
import readline from 'readline';

dotenv.config();

interface TagSeed {
  name: string;
  color: string;
  description: string;
  order: number;
  active?: boolean;
}

const tagsToSeed: TagSeed[] = [
  // Tags de estado/promoción (orden 1-10)
  {
    name: 'Nuevo',
    color: '#10B981',
    description: 'Productos recién agregados al catálogo',
    order: 1,
    active: true,
  },
  {
    name: 'Oferta',
    color: '#EF4444',
    description: 'Productos con descuentos especiales',
    order: 2,
    active: true,
  },
  {
    name: 'Descuento',
    color: '#F59E0B',
    description: 'Productos con precio rebajado',
    order: 3,
    active: true,
  },
  {
    name: 'Promoción',
    color: '#EC4899',
    description: 'Productos en promoción temporal',
    order: 4,
    active: true,
  },
  {
    name: 'Destacado',
    color: '#8B5CF6',
    description: 'Productos destacados por el administrador',
    order: 5,
    active: true,
  },
  {
    name: 'Favorito',
    color: '#F97316',
    description: 'Productos favoritos de los clientes',
    order: 6,
    active: true,
  },
  {
    name: 'Más Vendido',
    color: '#0EA5E9',
    description: 'Productos con mayor volumen de ventas',
    order: 7,
    active: true,
  },
  {
    name: 'Agotándose',
    color: '#DC2626',
    description: 'Últimas unidades disponibles',
    order: 8,
    active: true,
  },
  {
    name: 'Próximamente',
    color: '#6366F1',
    description: 'Productos que llegarán pronto',
    order: 9,
    active: true,
  },
  {
    name: 'Exclusivo',
    color: '#A855F7',
    description: 'Productos exclusivos de la tienda',
    order: 10,
    active: true,
  },

  // Tags de características dietéticas/nutricionales (orden 11-20)
  {
    name: 'Sin TACC',
    color: '#8B5CF6',
    description: 'Productos sin gluten, aptos para celíacos',
    order: 11,
    active: true,
  },
  {
    name: 'Sin Azúcar',
    color: '#059669',
    description: 'Productos sin azúcar agregada',
    order: 12,
    active: true,
  },
  {
    name: 'Light',
    color: '#06B6D4',
    description: 'Productos bajos en calorías',
    order: 13,
    active: true,
  },
  {
    name: 'Zero',
    color: '#14B8A6',
    description: 'Productos zero calorías',
    order: 14,
    active: true,
  },
  {
    name: 'Orgánico',
    color: '#84CC16',
    description: 'Productos de origen orgánico',
    order: 15,
    active: true,
  },
  {
    name: 'Vegano',
    color: '#22C55E',
    description: 'Productos sin ingredientes de origen animal',
    order: 16,
    active: true,
  },
  {
    name: 'Sin Lactosa',
    color: '#3B82F6',
    description: 'Productos sin lactosa',
    order: 17,
    active: true,
  },
  {
    name: 'Natural',
    color: '#10B981',
    description: 'Productos con ingredientes naturales',
    order: 18,
    active: true,
  },

  // Tags de tipo/categoría (orden 21-35)
  {
    name: 'Chocolate',
    color: '#92400E',
    description: 'Productos de chocolate',
    order: 21,
    active: true,
  },
  {
    name: 'Caramelo',
    color: '#DC2626',
    description: 'Caramelos y golosinas',
    order: 22,
    active: true,
  },
  {
    name: 'Galleta',
    color: '#D97706',
    description: 'Galletas dulces y saladas',
    order: 23,
    active: true,
  },
  {
    name: 'Snack',
    color: '#F59E0B',
    description: 'Snacks y aperitivos',
    order: 24,
    active: true,
  },
  {
    name: 'Bebida',
    color: '#0EA5E9',
    description: 'Bebidas y refrescos',
    order: 25,
    active: true,
  },
  {
    name: 'Helado',
    color: '#60A5FA',
    description: 'Helados y postres congelados',
    order: 26,
    active: true,
  },
  {
    name: 'Bombón',
    color: '#7C2D12',
    description: 'Bombones finos',
    order: 27,
    active: true,
  },
  {
    name: 'Chicle',
    color: '#EC4899',
    description: 'Chicles y gomas de mascar',
    order: 28,
    active: true,
  },
  {
    name: 'Alfajor',
    color: '#B45309',
    description: 'Alfajores tradicionales',
    order: 29,
    active: true,
  },

  // Tags de ocasión (orden 36-45)
  {
    name: 'Infantil',
    color: '#F472B6',
    description: 'Productos para niños',
    order: 36,
    active: true,
  },
  {
    name: 'Adulto',
    color: '#64748B',
    description: 'Productos para adultos',
    order: 37,
    active: true,
  },
  {
    name: 'Familiar',
    color: '#10B981',
    description: 'Productos tamaño familiar',
    order: 38,
    active: true,
  },
  {
    name: 'Individual',
    color: '#6366F1',
    description: 'Porciones individuales',
    order: 39,
    active: true,
  },
  {
    name: 'Para Compartir',
    color: '#8B5CF6',
    description: 'Tamaño ideal para compartir',
    order: 40,
    active: true,
  },
  {
    name: 'Cumpleaños',
    color: '#EC4899',
    description: 'Ideal para fiestas de cumpleaños',
    order: 41,
    active: true,
  },
  {
    name: 'Navidad',
    color: '#DC2626',
    description: 'Productos especiales para Navidad',
    order: 42,
    active: true,
  },
  {
    name: 'Regalo',
    color: '#F59E0B',
    description: 'Ideal para regalar',
    order: 43,
    active: true,
  },

  // Tags de origen/calidad (orden 46-50)
  {
    name: 'Importado',
    color: '#0284C7',
    description: 'Productos importados',
    order: 46,
    active: true,
  },
  {
    name: 'Nacional',
    color: '#16A34A',
    description: 'Productos de fabricación nacional',
    order: 47,
    active: true,
  },
  {
    name: 'Premium',
    color: '#7C3AED',
    description: 'Productos de calidad premium',
    order: 48,
    active: true,
  },
  {
    name: 'Económico',
    color: '#059669',
    description: 'Productos de precio accesible',
    order: 49,
    active: true,
  },
  {
    name: 'Artesanal',
    color: '#B45309',
    description: 'Productos de elaboración artesanal',
    order: 50,
    active: true,
  },
];

async function seedTags() {
  try {
    console.log('🔄 Iniciando seed de tags con información completa...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    // Preguntar si limpiar tags existentes
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        '¿Deseas eliminar todos los tags existentes antes de crear los nuevos? (s/n): ',
        resolve
      );
    });
    rl.close();

    if (answer.toLowerCase() === 's') {
      const deleted = await Tag.deleteMany({});
      console.log(`\n🗑️  ${deleted.deletedCount} tags eliminados\n`);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    console.log('🏷️  Procesando tags...\n');

    for (const tagData of tagsToSeed) {
      try {
        // Verificar si el tag ya existe (por nombre, case-insensitive)
        const existing = await Tag.findOne({
          name: { $regex: new RegExp(`^${tagData.name}$`, 'i') },
        });

        if (existing) {
          // Actualizar tag existente
          existing.color = tagData.color;
          existing.description = tagData.description;
          existing.order = tagData.order;
          existing.active = tagData.active !== undefined ? tagData.active : existing.active;
          await existing.save();
          updated++;
          console.log(`🔄 Tag actualizado: ${tagData.name} (${tagData.color})`);
        } else {
          // Crear nuevo tag
          await Tag.create({
            name: tagData.name,
            color: tagData.color,
            description: tagData.description,
            order: tagData.order,
            active: tagData.active !== undefined ? tagData.active : true,
          });
          created++;
          console.log(`✅ Tag creado: ${tagData.name} (${tagData.color})`);
        }
      } catch (error: any) {
        console.error(`❌ Error con "${tagData.name}":`, error.message);
        skipped++;
      }
    }

    // Resumen
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESUMEN DE SEED');
    console.log('═'.repeat(70));
    console.log(`✅ Tags creados: ${created}`);
    console.log(`🔄 Tags actualizados: ${updated}`);
    console.log(`⚠️  Tags omitidos: ${skipped}`);
    console.log(`📦 Total tags procesados: ${tagsToSeed.length}`);
    console.log('═'.repeat(70) + '\n');

    // Estadísticas adicionales
    const totalTags = await Tag.countDocuments();
    const activeTags = await Tag.countDocuments({ active: true });

    console.log('📈 ESTADÍSTICAS DE BASE DE DATOS');
    console.log('═'.repeat(70));
    console.log(`Total tags en BD: ${totalTags}`);
    console.log(`Tags activos: ${activeTags}`);
    console.log(`Tags inactivos: ${totalTags - activeTags}`);
    console.log('═'.repeat(70) + '\n');

    // Mostrar tags por categoría
    console.log('📑 TAGS POR CATEGORÍA');
    console.log('═'.repeat(70));
    console.log('🏆 Estado/Promoción (1-10): 10 tags');
    console.log('🥗 Características Dietéticas (11-20): 8 tags');
    console.log('🍫 Tipo/Categoría (21-35): 9 tags');
    console.log('🎉 Ocasión (36-45): 8 tags');
    console.log('🌍 Origen/Calidad (46-50): 5 tags');
    console.log('═'.repeat(70) + '\n');

    console.log('🎉 Seed de tags completado exitosamente!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed de tags:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Ejecutar seed
seedTags();
