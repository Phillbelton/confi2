import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import { Product } from '../models/Product';

dotenv.config();

/**
 * Limpieza puntual: elimina el campo `provider` de los documentos de
 * la colección `products`. El campo fue dado de baja del schema, pero
 * los documentos creados/importados antes del cambio conservan el dato
 * huérfano. Mongoose lo ignora al leer, este script lo borra de raíz.
 *
 * Se opera sobre la colección nativa (`Product.collection`) porque el
 * campo ya no existe en el schema y `$unset` tipado no lo alcanzaría.
 *
 * Uso: npm run cleanup:provider  (desde /backend)
 */
async function cleanupProviderField() {
  try {
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    const filter = { provider: { $exists: true } };
    const affected = await Product.collection.countDocuments(filter);

    if (affected === 0) {
      console.log('✨ Ningún producto tiene el campo `provider`. Nada que limpiar.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`🔍 ${affected} producto(s) con el campo \`provider\` huérfano.\n`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await new Promise<string>((resolve) => {
      rl.question(
        `¿Eliminar \`provider\` de esos ${affected} documento(s)? (s/n): `,
        resolve
      );
    });
    rl.close();

    if (answer.trim().toLowerCase() !== 's') {
      console.log('\n⏹️  Cancelado. No se modificó nada.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    const result = await Product.collection.updateMany(filter, {
      $unset: { provider: '' },
    });

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN');
    console.log('═'.repeat(60));
    console.log(`✅ Documentos modificados: ${result.modifiedCount}`);
    const remaining = await Product.collection.countDocuments(filter);
    console.log(`📦 Documentos con \`provider\` restantes: ${remaining}`);
    console.log('═'.repeat(60) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la limpieza de `provider`:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanupProviderField();
