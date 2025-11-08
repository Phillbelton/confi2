import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from '../models/Category';

dotenv.config();

interface CategorySeed {
  name: string;
  description: string;
  parentName?: string; // Nombre del padre (para subcategorías)
  order?: number;
  active?: boolean;
}

const categoriesToSeed: CategorySeed[] = [
  // ============================================
  // CATEGORÍAS PRINCIPALES (sin parent)
  // ============================================
  {
    name: 'Categoria-1-Bebidas',
    description: 'Bebidas y líquidos en general',
    order: 1,
    active: true,
  },
  {
    name: 'Categoria-2-Snacks',
    description: 'Snacks salados y dulces',
    order: 2,
    active: true,
  },
  {
    name: 'Categoria-3-Chocolates',
    description: 'Productos de chocolate en todas sus formas',
    order: 3,
    active: true,
  },
  {
    name: 'Categoria-4-Caramelos',
    description: 'Caramelos y confitería',
    order: 4,
    active: true,
  },
  {
    name: 'Categoria-5-Reposteria',
    description: 'Productos de repostería y panadería',
    order: 5,
    active: true,
  },
  {
    name: 'Categoria-6-Helados',
    description: 'Helados y productos congelados',
    order: 6,
    active: true,
  },

  // ============================================
  // SUBCATEGORÍAS de Categoria-1-Bebidas
  // ============================================
  {
    name: 'Subcat-1A-Gaseosas',
    description: 'Bebidas gaseosas y carbonatadas',
    parentName: 'Categoria-1-Bebidas',
    order: 1,
    active: true,
  },
  {
    name: 'Subcat-1B-Jugos',
    description: 'Jugos y néctares de frutas',
    parentName: 'Categoria-1-Bebidas',
    order: 2,
    active: true,
  },
  {
    name: 'Subcat-1C-Aguas',
    description: 'Aguas minerales y purificadas',
    parentName: 'Categoria-1-Bebidas',
    order: 3,
    active: true,
  },

  // ============================================
  // SUBCATEGORÍAS de Categoria-2-Snacks
  // ============================================
  {
    name: 'Subcat-2A-Salados',
    description: 'Snacks salados (papas, nachos, etc.)',
    parentName: 'Categoria-2-Snacks',
    order: 1,
    active: true,
  },
  {
    name: 'Subcat-2B-Dulces',
    description: 'Snacks dulces y azucarados',
    parentName: 'Categoria-2-Snacks',
    order: 2,
    active: true,
  },
  {
    name: 'Subcat-2C-Frutos-Secos',
    description: 'Frutos secos y mezclas',
    parentName: 'Categoria-2-Snacks',
    order: 3,
    active: true,
  },

  // ============================================
  // SUBCATEGORÍAS de Categoria-3-Chocolates
  // ============================================
  {
    name: 'Subcat-3A-Barras',
    description: 'Barras de chocolate individuales',
    parentName: 'Categoria-3-Chocolates',
    order: 1,
    active: true,
  },
  {
    name: 'Subcat-3B-Bombones',
    description: 'Bombones y chocolates rellenos',
    parentName: 'Categoria-3-Chocolates',
    order: 2,
    active: true,
  },
  {
    name: 'Subcat-3C-Premium',
    description: 'Chocolates premium y artesanales',
    parentName: 'Categoria-3-Chocolates',
    order: 3,
    active: true,
  },

  // ============================================
  // SUBCATEGORÍAS de Categoria-4-Caramelos
  // ============================================
  {
    name: 'Subcat-4A-Duros',
    description: 'Caramelos duros y lollipops',
    parentName: 'Categoria-4-Caramelos',
    order: 1,
    active: true,
  },
  {
    name: 'Subcat-4B-Gomitas',
    description: 'Gomitas y caramelos blandos',
    parentName: 'Categoria-4-Caramelos',
    order: 2,
    active: true,
  },
  {
    name: 'Subcat-4C-Chicles',
    description: 'Chicles y gomas de mascar',
    parentName: 'Categoria-4-Caramelos',
    order: 3,
    active: true,
  },

  // ============================================
  // SUBCATEGORÍAS de Categoria-5-Reposteria
  // ============================================
  {
    name: 'Subcat-5A-Galletas',
    description: 'Galletas dulces y saladas',
    parentName: 'Categoria-5-Reposteria',
    order: 1,
    active: true,
  },
  {
    name: 'Subcat-5B-Alfajores',
    description: 'Alfajores y productos rellenos',
    parentName: 'Categoria-5-Reposteria',
    order: 2,
    active: true,
  },
  {
    name: 'Subcat-5C-Obleas',
    description: 'Obleas y barquillos',
    parentName: 'Categoria-5-Reposteria',
    order: 3,
    active: true,
  },

  // ============================================
  // SUBCATEGORÍAS de Categoria-6-Helados
  // ============================================
  {
    name: 'Subcat-6A-Paletas-Agua',
    description: 'Paletas de agua saborizadas',
    parentName: 'Categoria-6-Helados',
    order: 1,
    active: true,
  },
  {
    name: 'Subcat-6B-Paletas-Crema',
    description: 'Paletas de crema y helado cremoso',
    parentName: 'Categoria-6-Helados',
    order: 2,
    active: true,
  },
  {
    name: 'Subcat-6C-Paletas-Aguacrema',
    description: 'Paletas combinación agua y crema',
    parentName: 'Categoria-6-Helados',
    order: 3,
    active: true,
  },
  {
    name: 'Subcat-6D-Cassatas',
    description: 'Cassatas y helados en caja',
    parentName: 'Categoria-6-Helados',
    order: 4,
    active: true,
  },
  {
    name: 'Subcat-6E-Conos',
    description: 'Conos de helado individuales',
    parentName: 'Categoria-6-Helados',
    order: 5,
    active: true,
  },
];

async function seedCategories() {
  try {
    console.log('🔄 Iniciando seed de categorías...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Preguntar si limpiar categorías existentes
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('¿Deseas eliminar todas las categorías existentes antes de crear las nuevas? (s/n): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      const deleteCount = await Category.deleteMany({});
      console.log(`\n🗑️  ${deleteCount.deletedCount} categorías eliminadas\n`);
    }

    let createdCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    // Mapeo de nombres a IDs para las relaciones parent
    const categoryIdMap = new Map<string, mongoose.Types.ObjectId>();

    // PASO 1: Crear/Actualizar categorías principales (sin parent)
    console.log('📂 Creando categorías principales...\n');
    const mainCategories = categoriesToSeed.filter(cat => !cat.parentName);

    for (const categoryData of mainCategories) {
      try {
        const existingCategory = await Category.findOne({ name: categoryData.name });

        if (existingCategory) {
          console.log(`⚠️  "${categoryData.name}" ya existe - Actualizando...`);
          existingCategory.description = categoryData.description;
          existingCategory.order = categoryData.order ?? 0;
          existingCategory.active = categoryData.active ?? true;
          existingCategory.parent = undefined; // Asegurar que no tiene padre
          await existingCategory.save();
          categoryIdMap.set(categoryData.name, existingCategory._id);
          updatedCount++;
        } else {
          const category = await Category.create({
            name: categoryData.name,
            description: categoryData.description,
            order: categoryData.order ?? 0,
            active: categoryData.active ?? true,
            parent: null,
          });
          categoryIdMap.set(categoryData.name, category._id);
          console.log(`✅ ${category.name}`);
          createdCount++;
        }
      } catch (error: any) {
        console.error(`❌ Error con "${categoryData.name}":`, error.message);
        skippedCount++;
      }
    }

    // PASO 2: Crear/Actualizar subcategorías (con parent)
    console.log('\n📁 Creando subcategorías...\n');
    const subCategories = categoriesToSeed.filter(cat => cat.parentName);

    for (const categoryData of subCategories) {
      try {
        if (!categoryData.parentName) continue;

        const parentId = categoryIdMap.get(categoryData.parentName);
        if (!parentId) {
          console.error(`❌ Padre "${categoryData.parentName}" no encontrado para "${categoryData.name}"`);
          skippedCount++;
          continue;
        }

        const existingCategory = await Category.findOne({ name: categoryData.name });

        if (existingCategory) {
          console.log(`⚠️  "${categoryData.name}" ya existe - Actualizando...`);
          existingCategory.description = categoryData.description;
          existingCategory.parent = parentId;
          existingCategory.order = categoryData.order ?? 0;
          existingCategory.active = categoryData.active ?? true;
          await existingCategory.save();
          categoryIdMap.set(categoryData.name, existingCategory._id);
          updatedCount++;
        } else {
          const category = await Category.create({
            name: categoryData.name,
            description: categoryData.description,
            parent: parentId,
            order: categoryData.order ?? 0,
            active: categoryData.active ?? true,
          });
          categoryIdMap.set(categoryData.name, category._id);
          console.log(`✅ ${category.name} → ${categoryData.parentName}`);
          createdCount++;
        }
      } catch (error: any) {
        console.error(`❌ Error con "${categoryData.name}":`, error.message);
        skippedCount++;
      }
    }

    // Resumen
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESUMEN DE SEED');
    console.log('═'.repeat(70));
    console.log(`✅ Creadas: ${createdCount}`);
    console.log(`🔄 Actualizadas: ${updatedCount}`);
    console.log(`⚠️  Omitidas: ${skippedCount}`);
    console.log(`📦 Total procesadas: ${categoriesToSeed.length}`);
    console.log('═'.repeat(70) + '\n');

    // Mostrar jerarquía de categorías
    console.log('═'.repeat(90));
    console.log('📂 ESTRUCTURA DE CATEGORÍAS');
    console.log('═'.repeat(90));
    console.log('');

    const mainCats = await Category.find({ parent: null, active: true }).sort({ order: 1, name: 1 });

    for (const mainCat of mainCats) {
      console.log(`\n📁 ${mainCat.name.toUpperCase()}`);
      console.log(`   ${mainCat.description}`);
      console.log(`   Slug: ${mainCat.slug}`);

      const subCats = await Category.find({ parent: mainCat._id, active: true }).sort({ order: 1, name: 1 });

      if (subCats.length > 0) {
        console.log('   Subcategorías:');
        subCats.forEach((subCat, index) => {
          const isLast = index === subCats.length - 1;
          const prefix = isLast ? '   └─' : '   ├─';
          console.log(`${prefix} ${subCat.name} (${subCat.description})`);
          console.log(`      Slug: ${subCat.slug}`);
        });
      }
    }

    console.log('\n' + '═'.repeat(90) + '\n');

  } catch (error: any) {
    console.error('❌ Error fatal en seed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
if (require.main === module) {
  seedCategories();
}

export default seedCategories;
