import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

async function seedAdmin() {
  try {
    console.log('🔄 Iniciando creación de usuario administrador...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.name}\n`);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        readline.question('¿Deseas crear otro administrador de todas formas? (s/n): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 's') {
        console.log('❌ Operación cancelada');
        return;
      }
    }

    // Datos del admin desde .env o valores por defecto
    const adminData = {
      name: process.env.DEFAULT_ADMIN_NAME || 'Admin Quelita',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@quelita.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
      phone: process.env.WHATSAPP_BUSINESS_PHONE || '595981234567',
      role: 'admin' as const,
      active: true,
    };

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      console.log(`\n⚠️  Ya existe un usuario con el email ${adminData.email}`);
      console.log(`   Rol actual: ${existingUser.role}`);

      if (existingUser.role !== 'admin') {
        console.log('\n🔄 Actualizando rol a administrador...');
        existingUser.role = 'admin';
        existingUser.active = true;
        await existingUser.save();
        console.log('✅ Usuario actualizado a administrador exitosamente!\n');
      } else {
        console.log('ℹ️  El usuario ya es administrador\n');
      }

      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Crear el usuario admin
    const admin = await User.create({
      ...adminData,
      password: hashedPassword,
    });

    console.log('✅ Usuario administrador creado exitosamente!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('📋 CREDENCIALES DEL ADMINISTRADOR');
    console.log('═══════════════════════════════════════════════');
    console.log(`Email:    ${admin.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log(`Nombre:   ${admin.name}`);
    console.log(`Teléfono: ${admin.phone}`);
    console.log(`ID:       ${admin._id}`);
    console.log('═══════════════════════════════════════════════\n');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login\n');

  } catch (error: any) {
    console.error('❌ Error creando administrador:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
if (require.main === module) {
  seedAdmin();
}

export default seedAdmin;
