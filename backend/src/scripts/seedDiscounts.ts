import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductVariant from '../models/ProductVariant';

dotenv.config();

/**
 * Script para aplicar descuentos de prueba a productos existentes
 * Crea diferentes escenarios de descuentos:
 * - Descuentos fijos (percentage y amount)
 * - Descuentos escalonados (tiered)
 * - Combinación de ambos (stacking)
 * - Con fechas de vigencia
 * - Con badges
 */

async function seedDiscounts() {
  try {
    console.log('🔄 Iniciando seed de descuentos...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Obtener variantes existentes
    const variants = await ProductVariant.find({ active: true }).limit(20);

    if (variants.length === 0) {
      console.log('⚠️  No hay variantes de productos para aplicar descuentos.');
      console.log('   Ejecuta primero: npm run seed:products');
      return;
    }

    console.log(`📦 Encontradas ${variants.length} variantes de productos\n`);

    // Preguntar si limpiar descuentos existentes
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('¿Deseas limpiar todos los descuentos existentes antes de crear nuevos? (s/n): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      await ProductVariant.updateMany(
        {},
        {
          $unset: { fixedDiscount: 1, tieredDiscount: 1 }
        }
      );
      console.log('\n🗑️  Descuentos existentes eliminados\n');
    }

    let updatedCount = 0;

    // Escenario 1: Descuento fijo porcentual (15% off)
    if (variants[0]) {
      variants[0].fixedDiscount = {
        enabled: true,
        type: 'percentage',
        value: 15,
        badge: '15% OFF',
      };
      await variants[0].save();
      console.log(`✅ ${variants[0].name} - Descuento fijo 15%`);
      updatedCount++;
    }

    // Escenario 2: Descuento fijo en monto ($500 off)
    if (variants[1]) {
      variants[1].fixedDiscount = {
        enabled: true,
        type: 'amount',
        value: 500,
        badge: '$500 OFF',
      };
      await variants[1].save();
      console.log(`✅ ${variants[1].name} - Descuento fijo $500`);
      updatedCount++;
    }

    // Escenario 3: Descuento fijo con fecha de vigencia (válido por 30 días)
    if (variants[2]) {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      variants[2].fixedDiscount = {
        enabled: true,
        type: 'percentage',
        value: 20,
        startDate: now,
        endDate: endDate,
        badge: 'OFERTA 20%',
      };
      await variants[2].save();
      console.log(`✅ ${variants[2].name} - Descuento temporal 20% (30 días)`);
      updatedCount++;
    }

    // Escenario 4: Descuento escalonado básico (2+ = 10%, 5+ = 20%)
    if (variants[3]) {
      variants[3].tieredDiscount = {
        tiers: [
          { minQuantity: 2, maxQuantity: 4, type: 'percentage', value: 10 },
          { minQuantity: 5, maxQuantity: null, type: 'percentage', value: 20 },
        ],
        badge: 'COMPRA MÁS, AHORRA MÁS',
        active: true,
      };
      await variants[3].save();
      console.log(`✅ ${variants[3].name} - Descuento escalonado (2-4: 10%, 5+: 20%)`);
      updatedCount++;
    }

    // Escenario 5: Descuento escalonado con montos (3+ = $200, 6+ = $500)
    if (variants[4]) {
      variants[4].tieredDiscount = {
        tiers: [
          { minQuantity: 3, maxQuantity: 5, type: 'amount', value: 200 },
          { minQuantity: 6, maxQuantity: null, type: 'amount', value: 500 },
        ],
        badge: 'DESCUENTO POR VOLUMEN',
        active: true,
      };
      await variants[4].save();
      console.log(`✅ ${variants[4].name} - Descuento escalonado (3-5: $200, 6+: $500)`);
      updatedCount++;
    }

    // Escenario 6: STACKING - Descuento fijo + escalonado
    if (variants[5]) {
      variants[5].fixedDiscount = {
        enabled: true,
        type: 'percentage',
        value: 10,
        badge: '10% BASE',
      };
      variants[5].tieredDiscount = {
        tiers: [
          { minQuantity: 3, maxQuantity: 5, type: 'percentage', value: 5 },
          { minQuantity: 6, maxQuantity: null, type: 'percentage', value: 10 },
        ],
        badge: '+ HASTA 10% EXTRA',
        active: true,
      };
      await variants[5].save();
      console.log(`✅ ${variants[5].name} - STACKING: Fijo 10% + Escalonado (3+: 5%, 6+: 10%)`);
      updatedCount++;
    }

    // Escenario 7: STACKING - Descuento fijo en monto + escalonado porcentual
    if (variants[6]) {
      variants[6].fixedDiscount = {
        enabled: true,
        type: 'amount',
        value: 300,
        badge: '$300 OFF',
      };
      variants[6].tieredDiscount = {
        tiers: [
          { minQuantity: 2, maxQuantity: 3, type: 'percentage', value: 5 },
          { minQuantity: 4, maxQuantity: null, type: 'percentage', value: 15 },
        ],
        badge: '+ 15% EXTRA',
        active: true,
      };
      await variants[6].save();
      console.log(`✅ ${variants[6].name} - STACKING: Fijo $300 + Escalonado (2-3: 5%, 4+: 15%)`);
      updatedCount++;
    }

    // Escenario 8: Descuento escalonado complejo (4 niveles)
    if (variants[7]) {
      variants[7].tieredDiscount = {
        tiers: [
          { minQuantity: 2, maxQuantity: 3, type: 'percentage', value: 5 },
          { minQuantity: 4, maxQuantity: 6, type: 'percentage', value: 10 },
          { minQuantity: 7, maxQuantity: 11, type: 'percentage', value: 15 },
          { minQuantity: 12, maxQuantity: null, type: 'percentage', value: 25 },
        ],
        badge: 'DESCUENTO MAYORISTA',
        active: true,
      };
      await variants[7].save();
      console.log(`✅ ${variants[7].name} - Escalonado complejo (2-3: 5%, 4-6: 10%, 7-11: 15%, 12+: 25%)`);
      updatedCount++;
    }

    // Escenario 9: Descuento escalonado con fecha de vigencia
    if (variants[8]) {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 15);

      variants[8].tieredDiscount = {
        tiers: [
          { minQuantity: 2, maxQuantity: 4, type: 'percentage', value: 12 },
          { minQuantity: 5, maxQuantity: null, type: 'percentage', value: 18 },
        ],
        startDate: now,
        endDate: endDate,
        badge: 'PROMO LIMITADA',
        active: true,
      };
      await variants[8].save();
      console.log(`✅ ${variants[8].name} - Escalonado temporal (15 días): 2-4: 12%, 5+: 18%`);
      updatedCount++;
    }

    // Escenario 10: Descuento fijo deshabilitado (para testing)
    if (variants[9]) {
      variants[9].fixedDiscount = {
        enabled: false,
        type: 'percentage',
        value: 25,
        badge: 'INACTIVO',
      };
      await variants[9].save();
      console.log(`✅ ${variants[9].name} - Descuento fijo deshabilitado (testing)`);
      updatedCount++;
    }

    // Resumen
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESUMEN DE DESCUENTOS APLICADOS');
    console.log('═'.repeat(80));
    console.log(`✅ Variantes actualizadas: ${updatedCount}`);
    console.log('═'.repeat(80) + '\n');

    // Mostrar tabla detallada
    console.log('═'.repeat(120));
    console.log('💰 DESCUENTOS CONFIGURADOS');
    console.log('═'.repeat(120));
    console.log('');

    const variantsWithDiscounts = await ProductVariant.find({
      $or: [
        { 'fixedDiscount.enabled': true },
        { 'tieredDiscount.active': true }
      ]
    }).populate('parentProduct', 'name');

    variantsWithDiscounts.forEach((variant: any, index: number) => {
      const num = `${(index + 1).toString().padStart(2, ' ')}.`;
      const name = variant.name.substring(0, 40).padEnd(40, ' ');
      const price = `$${variant.price}`.padEnd(10, ' ');

      let discountInfo = '';

      if (variant.fixedDiscount?.enabled) {
        const type = variant.fixedDiscount.type === 'percentage' ? '%' : '$';
        const value = variant.fixedDiscount.value;
        discountInfo += `Fijo: ${value}${type} `;
      }

      if (variant.tieredDiscount?.active) {
        const tiers = variant.tieredDiscount.tiers.length;
        discountInfo += `| Escalonado: ${tiers} niveles `;
      }

      const badge = variant.fixedDiscount?.badge || variant.tieredDiscount?.badge || '';

      console.log(`${num} ${name} | Precio: ${price} | ${discountInfo} | ${badge}`);
    });

    console.log('\n' + '═'.repeat(120) + '\n');

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
  seedDiscounts();
}

export default seedDiscounts;
