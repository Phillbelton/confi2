const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log(`\nUsuarios encontrados: ${users.length}\n`);
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}) - Rol: ${u.role}`);
  });
  await mongoose.disconnect();
}
check();
