import dotenv from 'dotenv';
import path from 'path';

// Load appropriate .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const ENV = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI || '',
  DB_NAME: process.env.DB_NAME || 'confiteria_quelita',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Server
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '5000'}`,

  // WhatsApp — soporta dos nombres por compatibilidad histórica
  WHATSAPP_BUSINESS_NUMBER:
    process.env.WHATSAPP_BUSINESS_NUMBER ||
    process.env.WHATSAPP_BUSINESS_PHONE ||
    '',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '3145728', 10), // 3MB default

  // Cloudinary (Image CDN)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  USE_CLOUDINARY: process.env.USE_CLOUDINARY === 'true', // Enable/disable Cloudinary

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Order expiration (guest orders auto-cancel)
  ORDER_EXPIRATION_HOURS: parseInt(process.env.ORDER_EXPIRATION_HOURS || '48', 10),

  // Email (preparado para futuro)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@confiteriaquelita.com',
} as const;

/**
 * Longitud mínima exigida para los JWT secrets en producción.
 *
 * Justificación: HMAC-SHA256 con clave de N bytes tiene como máximo
 * N*8 bits de entropía. 32 bytes = 256 bits = matchea el espacio de
 * salida de SHA-256 (no se gana nada con más, no se debería usar menos).
 *
 * 32 CHARACTERES no equivale a 32 bytes de entropía (depende del juego
 * de caracteres) pero es el piso "obvio" para detectar el caso típico
 * de un developer poniendo "password123" o "supersecretoseguro".
 *
 * Para uso real, generar con:
 *   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
 */
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Patrones que indican baja entropía evidente: secreto compuesto solo
 * por minúsculas, solo dígitos, o solo el mismo carácter repetido. NO
 * pretende reemplazar un cálculo formal de entropía — solo bloquea los
 * errores groseros más comunes en deploys apresurados.
 */
const LOW_ENTROPY_PATTERNS: { name: string; matches: (s: string) => boolean }[] = [
  { name: 'solo minúsculas', matches: (s) => /^[a-z]+$/.test(s) },
  { name: 'solo dígitos', matches: (s) => /^\d+$/.test(s) },
  { name: 'un único carácter repetido', matches: (s) => /^(.)\1+$/.test(s) },
];

const ensureSecretStrength = (label: string, value: string): void => {
  if (value.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `❌ ${label} debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres ` +
      `(actual: ${value.length}). Generar con: ` +
      `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
    );
  }
  for (const pattern of LOW_ENTROPY_PATTERNS) {
    if (pattern.matches(value)) {
      throw new Error(
        `❌ ${label} tiene baja entropía (${pattern.name}). ` +
        `Generar uno aleatorio con: ` +
        `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
      );
    }
  }
};

// Validar variables críticas
export const validateEnv = (): void => {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);

  if (missing.length > 0) {
    throw new Error(`❌ Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  if (ENV.NODE_ENV === 'production') {
    if (ENV.JWT_SECRET === 'default_secret_change_in_production') {
      throw new Error('❌ JWT_SECRET debe ser cambiado en producción');
    }

    if (ENV.JWT_REFRESH_SECRET === 'default_refresh_secret') {
      throw new Error('❌ JWT_REFRESH_SECRET debe ser cambiado en producción');
    }

    if (ENV.JWT_REFRESH_SECRET === ENV.JWT_SECRET) {
      throw new Error('❌ JWT_REFRESH_SECRET no puede ser igual a JWT_SECRET');
    }

    // Forzar longitud + entropía mínima de ambos secretos. El JWT_SECRET
    // firma access tokens (acceso a la API). Si es brute-forceable
    // offline, un atacante puede falsificar tokens admin.
    ensureSecretStrength('JWT_SECRET', ENV.JWT_SECRET);
    ensureSecretStrength('JWT_REFRESH_SECRET', ENV.JWT_REFRESH_SECRET);

    // Validar configuración de email en producción
    if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASS) {
      console.warn('⚠️  ADVERTENCIA: Credenciales SMTP no configuradas. El servicio de emails no funcionará.');
    }
  }

  console.log('✅ Variables de entorno validadas correctamente');
};
