import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

interface UserSeed {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'funcionario' | 'cliente';
}

const usersToSeed: UserSeed[] = [
  // Administradores
  {
    name: 'Administrador Principal',
    email: 'admin@quelita.com',
    password: 'Admin123!',
    phone: '595981111111',
    role: 'admin',
  },
  {
    name: 'María González',
    email: 'maria.admin@quelita.com',
    password: 'Admin123!',
    phone: '595981111112',
    role: 'admin',
  },

  // Funcionarios
  {
    name: 'Carlos Ramírez',
    email: 'carlos.func@quelita.com',
    password: 'Func123!',
    phone: '595982222221',
    role: 'funcionario',
  },
  {
    name: 'Ana Silva',
    email: 'ana.func@quelita.com',
    password: 'Func123!',
    phone: '595982222222',
    role: 'funcionario',
  },
  {
    name: 'Roberto López',
    email: 'roberto.func@quelita.com',
    password: 'Func123!',
    phone: '595982222223',
    role: 'funcionario',
  },

  // Clientes
  {
    name: 'Juan Pérez',
    email: 'juan.cliente@example.com',
    password: 'Cliente123!',
    phone: '595983333331',
    role: 'cliente',
  },
  {
    name: 'Laura Martínez',
    email: 'laura.cliente@example.com',
    password: 'Cliente123!',
    phone: '595983333332',
    role: 'cliente',
  },
  {
    name: 'Pedro Sánchez',
    email: 'pedro.cliente@example.com',
    password: 'Cliente123!',
    phone: '595983333333',
    role: 'cliente',
  },
  {
    name: 'Sofía Torres',
    email: 'sofia.cliente@example.com',
    password: 'Cliente123!',
    phone: '595983333334',
    role: 'cliente',
  },
  {
    name: 'Diego Fernández',
    email: 'diego.cliente@example.com',
    password: 'Cliente123!',
    phone: '595983333335',
    role: 'cliente',
  },
];

async function seedUsers() {
  try {
    console.log('🔄 Iniciando seed de usuarios...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Preguntar si limpiar usuarios existentes
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('¿Deseas eliminar todos los usuarios existentes antes de crear los nuevos? (s/n): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      const deleteCount = await User.deleteMany({});
      console.log(`\n🗑️  ${deleteCount.deletedCount} usuarios eliminados\n`);
    }

    let createdCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    // Crear usuarios
    for (const userData of usersToSeed) {
      try {
        // Verificar si el email ya existe
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
          console.log(`⚠️  ${userData.email} ya existe - Actualizando...`);

          // Actualizar usuario existente
          existingUser.name = userData.name;
          existingUser.phone = userData.phone;
          existingUser.role = userData.role;
          existingUser.active = true;

          // Actualizar password (el pre-save hook lo hasheará si cambió)
          existingUser.password = userData.password;

          await existingUser.save();
          updatedCount++;
          continue;
        }

        // Crear usuario (el modelo User hasheará la contraseña automáticamente en el pre-save hook)
        const user = await User.create({
          name: userData.name,
          email: userData.email,
          password: userData.password, // Sin hashear, el modelo lo hace
          phone: userData.phone,
          role: userData.role,
          active: true,
        });

        console.log(`✅ ${userData.role.toUpperCase()}: ${user.name} (${user.email})`);
        createdCount++;

      } catch (error: any) {
        console.error(`❌ Error con ${userData.email}:`, error.message);
        skippedCount++;
      }
    }

    // Resumen
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN DE SEED');
    console.log('═'.repeat(60));
    console.log(`✅ Creados: ${createdCount}`);
    console.log(`🔄 Actualizados: ${updatedCount}`);
    console.log(`⚠️  Omitidos: ${skippedCount}`);
    console.log(`📦 Total procesados: ${usersToSeed.length}`);
    console.log('═'.repeat(60) + '\n');

    // Mostrar tabla de credenciales
    console.log('═'.repeat(80));
    console.log('🔑 CREDENCIALES DE ACCESO');
    console.log('═'.repeat(80));
    console.log('');

    // Agrupar por rol
    const adminUsers = usersToSeed.filter(u => u.role === 'admin');
    const funcionarioUsers = usersToSeed.filter(u => u.role === 'funcionario');
    const clienteUsers = usersToSeed.filter(u => u.role === 'cliente');

    console.log('👨‍💼 ADMINISTRADORES:');
    console.log('─'.repeat(80));
    adminUsers.forEach(user => {
      console.log(`   Nombre:   ${user.name}`);
      console.log(`   Email:    ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Teléfono: ${user.phone}`);
      console.log('');
    });

    console.log('👷 FUNCIONARIOS:');
    console.log('─'.repeat(80));
    funcionarioUsers.forEach(user => {
      console.log(`   Nombre:   ${user.name}`);
      console.log(`   Email:    ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Teléfono: ${user.phone}`);
      console.log('');
    });

    console.log('👤 CLIENTES:');
    console.log('─'.repeat(80));
    clienteUsers.forEach(user => {
      console.log(`   Nombre:   ${user.name}`);
      console.log(`   Email:    ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Teléfono: ${user.phone}`);
      console.log('');
    });

    console.log('═'.repeat(80));
    console.log('⚠️  IMPORTANTE: Cambia las contraseñas en producción');
    console.log('═'.repeat(80) + '\n');

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
  seedUsers();
}

export default seedUsers;
