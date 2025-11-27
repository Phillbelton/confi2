import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { User } from '../models/User';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Debug script to check orders and their customer.user field
 * Usage: npx ts-node src/scripts/debugOrders.ts <email>
 */
async function debugOrders() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error('Usage: npx ts-node src/scripts/debugOrders.ts <email>');
      process.exit(1);
    }

    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/confiteria';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    console.log(`\n👤 User found:`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);

    // Find orders by email (both with and without customer.user)
    const ordersByEmail = await Order.find({ 'customer.email': email })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📦 Orders with email "${email}":`);
    console.log(`   Total: ${ordersByEmail.length}`);

    ordersByEmail.forEach((order, idx) => {
      console.log(`\n   Order #${idx + 1}:`);
      console.log(`      Order Number: ${order.orderNumber}`);
      console.log(`      Created: ${order.createdAt}`);
      console.log(`      customer.email: ${order.customer.email}`);
      console.log(`      customer.user: ${order.customer.user || '❌ NOT SET (guest order)'}`);
      console.log(`      Status: ${order.status}`);
      console.log(`      Total: $${order.total}`);
    });

    // Find orders by customer.user
    const ordersByUserId = await Order.find({ 'customer.user': user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📦 Orders linked to user ID (customer.user = ${user._id}):`);
    console.log(`   Total: ${ordersByUserId.length}`);

    if (ordersByUserId.length === 0) {
      console.log('\n⚠️  NO ORDERS LINKED TO USER!');
      console.log('   This is why /perfil shows 0 orders.');
      console.log('   Orders were created as guest orders without customer.user field.');
    }

    console.log('\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugOrders();
