import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Brand } from '../models/Brand';

dotenv.config();

interface BrandSeed {
  name: string;
  active?: boolean;
}

const brandsToSeed: BrandSeed[] = [
  { name: 'Marca-A', active: true },
  { name: 'Marca-B', active: true },
  { name: 'Marca-C', active: true },
  { name: 'Marca-D', active: true },
  { name: 'Marca-E', active: true },
  { name: 'Marca-F', active: true },
  { name: 'Marca-G', active: true },
  { name: 'Marca-H', active: true },
  { name: 'Marca-I', active: true },
  { name: 'Marca-J', active: true },
  { name: 'Marca-K', active: true },
  { name: 'Marca-L', active: true },
  { name: 'Marca-M', active: true },
  { name: 'Marca-N', active: true },
  { name: 'Marca-O', active: true },
  { name: 'Marca-P', active: true },
  { name: 'Marca-Q', active: true },
  { name: 'Marca-R', active: true },
  { name: 'Marca-S', active: true },
  { name: 'Marca-T', active: true },
];

async function seedBrands() {
  try {
    console.log('🔄 Iniciando seed de marcas...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Preguntar si limpiar marcas existentes
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('¿Deseas eliminar todas las marcas existentes antes de crear las nuevas? (s/n): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      const deleteCount = await Brand.deleteMany({});
      console.log(`\n🗑️  ${deleteCount.deletedCount} marcas eliminadas\n`);
    }

    let createdCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    // Crear marcas
    for (const brandData of brandsToSeed) {
      try {
        // Verificar si el nombre ya existe
        const existingBrand = await Brand.findOne({ name: brandData.name });

        if (existingBrand) {
          console.log(`⚠️  "${brandData.name}" ya existe - Actualizando...`);

          // Actualizar marca existente
          existingBrand.active = brandData.active ?? true;

          await existingBrand.save();
          updatedCount++;
          continue;
        }

        // Crear marca
        const brand = await Brand.create({
          name: brandData.name,
          active: brandData.active ?? true,
        });

        console.log(`✅ ${brand.name}`);
        createdCount++;

      } catch (error: any) {
        console.error(`❌ Error con "${brandData.name}":`, error.message);
        skippedCount++;
      }
    }

    // Resumen
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN DE SEED');
    console.log('═'.repeat(60));
    console.log(`✅ Creadas: ${createdCount}`);
    console.log(`🔄 Actualizadas: ${updatedCount}`);
    console.log(`⚠️  Omitidas: ${skippedCount}`);
    console.log(`📦 Total procesadas: ${brandsToSeed.length}`);
    console.log('═'.repeat(60) + '\n');

    // Mostrar tabla de marcas
    console.log('═'.repeat(70));
    console.log('🏷️  MARCAS CREADAS');
    console.log('═'.repeat(70));
    console.log('');

    const allBrands = await Brand.find({}).sort({ name: 1 });

    allBrands.forEach((brand, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${brand.name.padEnd(20, ' ')} | Slug: ${brand.slug} | ${brand.active ? '✅' : '❌'}`);
    });

    console.log('\n' + '═'.repeat(70) + '\n');

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
  seedBrands();
}

export default seedBrands;
