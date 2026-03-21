const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: 'admin@quelita.com' });

  if (!user) {
    console.log('❌ Usuario no encontrado');
    return;
  }

  console.log('\n✅ Usuario encontrado:');
  console.log(`Email: ${user.email}`);
  console.log(`Nombre: ${user.name}`);
  console.log(`Rol: ${user.role}`);
  console.log(`Password hash existe: ${!!user.password}`);

  const isMatch = await bcrypt.compare('Admin123!', user.password);
  console.log(`\n🔑 Contraseña "Admin123!" coincide: ${isMatch ? '✅ SÍ' : '❌ NO'}`);

  await mongoose.disconnect();
}
test();
