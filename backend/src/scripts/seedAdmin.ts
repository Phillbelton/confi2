/**
 * Seed del usuario administrador inicial.
 *
 * REGLAS DE SEGURIDAD aplicadas:
 *
 *  1. NO HASHEAR LA PASSWORD ACÁ. El pre-save hook del modelo User
 *     (User.ts:179) ya la hashea. Doble-hash deja la cuenta imposible
 *     de loguear (regresión: el seed previo hacía bcrypt.hash manual).
 *
 *  2. La password DEBE venir explícitamente en DEFAULT_ADMIN_PASSWORD.
 *     No hay default hardcoded — si el operador olvida setear el env,
 *     el script ABORTA. Forzar una decisión consciente.
 *
 *  3. La password DEBE cumplir la política de complejidad (mismo schema
 *     que el resto del sistema). Eso bloquea passwords triviales tipo
 *     "Admin123!" que pasaban el min(8) viejo.
 *
 *  4. La password NO se imprime en la consola. Era un riesgo de leaks
 *     vía logs, screenshots de CI, históricos de terminal, etc. Si el
 *     operador la perdió, debe usar el flow normal de reset.
 *
 *  5. Si ya existe el admin, NO se sobrescribe nada — solo se actualiza
 *     el role si quedó como cliente/funcionario (caso de migración).
 *     Cambiar la password de un admin existente debe pasar por el
 *     endpoint normal (PUT /api/users/:id/password) que registra audit.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { strongPasswordSchema } from '../schemas/userSchemas';

dotenv.config();

const KNOWN_INSECURE_DEFAULTS = new Set([
  'Admin123!',                                  // default viejo del repo
  'admin',
  'password',
  'CambiaEsto123!InmediatamenteDespuesDelDeploy', // texto del .env.production.example
]);

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `❌ ${key} no está seteada. Configurala en .env antes de correr este seed.`
    );
  }
  return value.trim();
};

const ensureStrongPassword = (password: string): void => {
  if (KNOWN_INSECURE_DEFAULTS.has(password)) {
    throw new Error(
      '❌ DEFAULT_ADMIN_PASSWORD es una password conocida e insegura. ' +
      'Generá una nueva con: node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'base64\'))"'
    );
  }
  const result = strongPasswordSchema.safeParse(password);
  if (!result.success) {
    const reasons = result.error.errors.map((e) => `- ${e.message}`).join('\n');
    throw new Error(
      '❌ DEFAULT_ADMIN_PASSWORD no cumple la política de complejidad:\n' +
      reasons
    );
  }
};

async function seedAdmin() {
  try {
    console.log('🔄 Iniciando creación de usuario administrador...\n');

    const uri = requireEnv('MONGODB_URI');
    const adminEmail = requireEnv('DEFAULT_ADMIN_EMAIL').toLowerCase();
    const adminPassword = requireEnv('DEFAULT_ADMIN_PASSWORD');
    const adminName = process.env.DEFAULT_ADMIN_NAME?.trim() || 'Administrador';
    const adminPhone = process.env.WHATSAPP_BUSINESS_PHONE?.trim();

    ensureStrongPassword(adminPassword);

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB\n');

    // Caso 1: ya existe un user con ese email
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`ℹ️  Ya existe un admin con email ${adminEmail}.`);
        console.log('   No se sobrescribe la password — si la perdiste, usá el flow de reset.');
        return;
      }
      console.log(`⚠️  El email ${adminEmail} pertenece a un usuario "${existing.role}".`);
      console.log('   Promoviendo a admin (sin tocar password ni nada más)...');
      existing.role = 'admin';
      existing.active = true;
      await existing.save();
      console.log('✅ Promovido a admin.\n');
      return;
    }

    // Caso 2: crear admin nuevo. La password se pasa SIN hashear; el
    // pre-save hook del modelo User la hashea automáticamente (línea 179).
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      phone: adminPhone,
      role: 'admin',
      active: true,
    });

    console.log('✅ Usuario administrador creado.');
    console.log('═══════════════════════════════════════════════');
    console.log(`Email:  ${admin.email}`);
    console.log(`Nombre: ${admin.name}`);
    console.log(`ID:     ${admin._id}`);
    console.log('═══════════════════════════════════════════════');
    console.log('🔐 La password NO se imprime por seguridad.');
    console.log('   Es la que pusiste en DEFAULT_ADMIN_PASSWORD.\n');
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

if (require.main === module) {
  seedAdmin();
}

export default seedAdmin;
