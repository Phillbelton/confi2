#!/usr/bin/env node

/**
 * Script para generar secrets seguros para deployment
 * Uso: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 GENERADOR DE SECRETS PARA PRODUCCIÓN\n');
console.log('Copia estos valores a tus variables de entorno en Seenode:\n');
console.log('════════════════════════════════════════════════════════════\n');

// Generar JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=');
console.log(jwtSecret);
console.log('\n');

// Generar JWT Refresh Secret
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_REFRESH_SECRET=');
console.log(jwtRefreshSecret);
console.log('\n');

// Generar contraseña de admin segura
const adminPassword = crypto.randomBytes(16).toString('base64').replace(/[+/=]/g, '_');
console.log('DEFAULT_ADMIN_PASSWORD=');
console.log(adminPassword);
console.log('\n');

console.log('════════════════════════════════════════════════════════════\n');
console.log('⚠️  IMPORTANTE:');
console.log('1. Guarda estos valores en un lugar seguro');
console.log('2. NO los commitees al repositorio');
console.log('3. Úsalos solo en el panel de Seenode');
console.log('4. Cambia la contraseña del admin después del primer login\n');
