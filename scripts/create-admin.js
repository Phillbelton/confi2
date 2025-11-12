#!/usr/bin/env node

/**
 * CONFITERÍA QUELITA - CREATE ADMIN USER SCRIPT
 *
 * Creates an admin user for testing
 * Usage: node scripts/create-admin.js
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function createAdminUser() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Creating Admin User                                      ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Admin credentials
  const adminData = {
    name: 'Admin Quelita',
    email: 'admin@confiteriaquelita.com',
    password: 'Admin123!@#',
    phone: '+543513000000',
  };

  try {
    console.log('Attempting to create admin user...');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}\n`);

    // Try to register
    const res = await request(`${API_URL}/auth/register`, {
      method: 'POST',
      body: adminData,
    });

    if (res.status === 201 || res.status === 200) {
      console.log(`${colors.green}✓ Admin user created successfully!${colors.reset}\n`);
      console.log(`${colors.yellow}IMPORTANT: You need to manually change the role to 'admin' in MongoDB${colors.reset}`);
      console.log(`${colors.yellow}Run this in MongoDB shell or MongoDB Compass:${colors.reset}\n`);
      console.log(`${colors.cyan}db.users.updateOne(${colors.reset}`);
      console.log(`${colors.cyan}  { email: "${adminData.email}" },${colors.reset}`);
      console.log(`${colors.cyan}  { $set: { role: "admin" } }${colors.reset}`);
      console.log(`${colors.cyan})${colors.reset}\n`);

      console.log(`${colors.green}Then you can login at:${colors.reset}`);
      console.log(`URL: http://localhost:3000/admin/login`);
      console.log(`Email: ${adminData.email}`);
      console.log(`Password: ${adminData.password}\n`);
    } else if (res.status === 400 && res.data?.error?.includes('ya está registrado')) {
      console.log(`${colors.yellow}⚠️  User already exists with email: ${adminData.email}${colors.reset}\n`);
      console.log(`${colors.green}You can login with:${colors.reset}`);
      console.log(`Email: ${adminData.email}`);
      console.log(`Password: ${adminData.password}`);
      console.log(`\nIf you forgot the password, update it in MongoDB or create a new user.\n`);
    } else {
      console.log(`${colors.red}✗ Failed to create admin user${colors.reset}`);
      console.log(`Status: ${res.status}`);
      console.log(`Response:`, res.data);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error creating admin user${colors.reset}`);
    console.log(`Error: ${error.message}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.log(`${colors.yellow}⚠️  Backend is not running. Please start with:${colors.reset}`);
      console.log(`cd backend && npm run dev\n`);
    }
  }
}

createAdminUser();
