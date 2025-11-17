import { ENV } from '../config/env';
import logger from '../config/logger';
import { imageService } from '../services/imageService';

/**
 * Script para debugear configuración de Cloudinary
 */

console.log('\n=================================');
console.log('🔍 CLOUDINARY DEBUG SCRIPT');
console.log('=================================\n');

console.log('📋 Variables de Entorno:');
console.log('------------------------');
console.log(`USE_CLOUDINARY: ${ENV.USE_CLOUDINARY} (type: ${typeof ENV.USE_CLOUDINARY})`);
console.log(`CLOUDINARY_CLOUD_NAME: ${ENV.CLOUDINARY_CLOUD_NAME ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`CLOUDINARY_API_KEY: ${ENV.CLOUDINARY_API_KEY ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`CLOUDINARY_API_SECRET: ${ENV.CLOUDINARY_API_SECRET ? '✅ Configurado (***' + ENV.CLOUDINARY_API_SECRET.slice(-4) + ')' : '❌ No configurado'}`);

console.log('\n📊 Estado del Servicio:');
console.log('------------------------');

const checkCloudinaryEnabled = () => {
  const enabled = ENV.USE_CLOUDINARY &&
    !!ENV.CLOUDINARY_CLOUD_NAME &&
    !!ENV.CLOUDINARY_API_KEY &&
    !!ENV.CLOUDINARY_API_SECRET;

  console.log(`Cloudinary Enabled: ${enabled ? '✅ SÍ' : '❌ NO'}`);

  if (!enabled) {
    console.log('\n❌ Razones por las que NO está habilitado:');
    if (!ENV.USE_CLOUDINARY) {
      console.log('  - USE_CLOUDINARY es falso o no está definido');
      console.log(`    Valor actual: ${process.env.USE_CLOUDINARY}`);
    }
    if (!ENV.CLOUDINARY_CLOUD_NAME) {
      console.log('  - CLOUDINARY_CLOUD_NAME no está configurado');
    }
    if (!ENV.CLOUDINARY_API_KEY) {
      console.log('  - CLOUDINARY_API_KEY no está configurado');
    }
    if (!ENV.CLOUDINARY_API_SECRET) {
      console.log('  - CLOUDINARY_API_SECRET no está configurado');
    }
  }

  return enabled;
};

const isEnabled = checkCloudinaryEnabled();

console.log('\n📁 Servicio de Imágenes Actual:');
console.log('--------------------------------');
console.log(isEnabled ? '☁️  Cloudinary' : '💾 Almacenamiento Local');

console.log('\n=================================\n');

process.exit(0);
