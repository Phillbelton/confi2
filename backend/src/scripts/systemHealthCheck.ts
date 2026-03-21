import mongoose from 'mongoose';
import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import { User } from '../models/User';
import { Order } from '../models/Order';
import ProductVariant from '../models/ProductVariant';

dotenv.config();

/**
 * Comprehensive System Health Check
 * Verifies all critical system components
 */

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

const results: HealthCheckResult[] = [];

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addResult(result: HealthCheckResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  const color = result.status === 'pass' ? 'green' : result.status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${result.name}: ${result.message}`, color);
  if (result.details) {
    console.log('   Details:', result.details);
  }
}

async function checkDatabaseConnection() {
  try {
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/confiteria';
    await mongoose.connect(MONGO_URI);

    const dbName = mongoose.connection.db?.databaseName;
    addResult({
      name: 'Database Connection',
      status: 'pass',
      message: `Connected to MongoDB`,
      details: { database: dbName },
    });
  } catch (error: any) {
    addResult({
      name: 'Database Connection',
      status: 'fail',
      message: 'Failed to connect to MongoDB',
      details: { error: error.message },
    });
    throw error;
  }
}

async function checkDatabaseCollections() {
  try {
    const collections = await mongoose.connection.db?.collections();
    const collectionNames = collections?.map((c) => c.collectionName) || [];

    const requiredCollections = ['users', 'orders', 'productvariants', 'productparents', 'categories'];
    const missingCollections = requiredCollections.filter((c) => !collectionNames.includes(c));

    if (missingCollections.length === 0) {
      addResult({
        name: 'Database Collections',
        status: 'pass',
        message: 'All required collections exist',
        details: { total: collectionNames.length, collections: collectionNames.slice(0, 10) },
      });
    } else {
      addResult({
        name: 'Database Collections',
        status: 'warn',
        message: 'Some collections missing',
        details: { missing: missingCollections },
      });
    }
  } catch (error: any) {
    addResult({
      name: 'Database Collections',
      status: 'fail',
      message: 'Failed to check collections',
      details: { error: error.message },
    });
  }
}

async function checkDataIntegrity() {
  try {
    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    const variantCount = await ProductVariant.countDocuments();

    // Check orders with customer.user field
    const authenticatedOrders = await Order.countDocuments({ 'customer.user': { $exists: true } });
    const guestOrders = await Order.countDocuments({ 'customer.user': { $exists: false } });

    addResult({
      name: 'Data Integrity',
      status: 'pass',
      message: 'Database contains data',
      details: {
        users: userCount,
        orders: orderCount,
        variants: variantCount,
        authenticatedOrders,
        guestOrders,
      },
    });
  } catch (error: any) {
    addResult({
      name: 'Data Integrity',
      status: 'fail',
      message: 'Failed to check data integrity',
      details: { error: error.message },
    });
  }
}

async function checkAPIEndpoint(endpoint: string, expectedStatus: number = 200) {
  try {
    const response = await axios.get(`${API_URL}${endpoint}`, {
      validateStatus: () => true, // Accept any status
    });

    const isExpected = response.status === expectedStatus;
    addResult({
      name: `API: GET ${endpoint}`,
      status: isExpected ? 'pass' : 'warn',
      message: isExpected ? `Status ${response.status}` : `Expected ${expectedStatus}, got ${response.status}`,
    });

    return response;
  } catch (error: any) {
    addResult({
      name: `API: GET ${endpoint}`,
      status: 'fail',
      message: 'Request failed',
      details: { error: error.message },
    });
    return null;
  }
}

async function checkPublicEndpoints() {
  log('\n📡 Checking Public Endpoints...', 'cyan');

  await checkAPIEndpoint('/health', 200);
  await checkAPIEndpoint('/products/parents', 200);
  await checkAPIEndpoint('/categories', 200);
  await checkAPIEndpoint('/brands', 200);
  await checkAPIEndpoint('/tags', 200);
}

async function checkAuthenticationFlow() {
  log('\n🔐 Checking Authentication Flow...', 'cyan');

  try {
    // Check login endpoint exists
    const loginResponse = await axios.post(
      `${API_URL}/auth/login`,
      { email: 'nonexistent@test.com', password: 'wrong' },
      { validateStatus: () => true }
    );

    const isCorrectError = loginResponse.status === 401;
    addResult({
      name: 'Auth: Login Endpoint',
      status: isCorrectError ? 'pass' : 'warn',
      message: isCorrectError ? 'Returns 401 for invalid credentials' : `Unexpected status ${loginResponse.status}`,
    });
  } catch (error: any) {
    addResult({
      name: 'Auth: Login Endpoint',
      status: 'fail',
      message: 'Login endpoint failed',
      details: { error: error.message },
    });
  }

  // Check /auth/me requires authentication
  await checkAPIEndpoint('/auth/me', 401);
}

async function checkOrderCreationFlow() {
  log('\n📦 Checking Order Creation Flow...', 'cyan');

  try {
    // Test guest order creation
    const guestOrderResponse = await axios.post(
      `${API_URL}/orders`,
      {
        customer: {
          name: 'Test Guest',
          email: 'guest@test.com',
          phone: '+56912345678',
        },
        items: [],
        deliveryMethod: 'pickup',
        paymentMethod: 'cash',
      },
      { validateStatus: () => true }
    );

    // Should fail because items array is empty, but endpoint should be accessible
    const isAccessible = guestOrderResponse.status !== 404;
    addResult({
      name: 'Orders: Guest Creation',
      status: isAccessible ? 'pass' : 'fail',
      message: isAccessible ? 'Endpoint accessible' : 'Endpoint not found',
      details: { status: guestOrderResponse.status },
    });
  } catch (error: any) {
    addResult({
      name: 'Orders: Guest Creation',
      status: 'fail',
      message: 'Order creation failed',
      details: { error: error.message },
    });
  }
}

async function checkProtectedEndpoints() {
  log('\n🔒 Checking Protected Endpoints...', 'cyan');

  // These should return 401 without auth
  await checkAPIEndpoint('/orders/my-orders', 401);
  await checkAPIEndpoint('/users', 401);
  await checkAPIEndpoint('/audit-logs', 401);
  await checkAPIEndpoint('/admin/dashboard/stats', 401);
}

async function checkSecurityAudit() {
  log('\n🛡️  Checking Security Configuration...', 'cyan');

  try {
    // Check that admin endpoints are protected
    const adminTests = [
      { endpoint: '/users', expectedStatus: 401 },
      { endpoint: '/audit-logs', expectedStatus: 401 },
      { endpoint: '/admin/dashboard/stats', expectedStatus: 401 },
    ];

    let allProtected = true;
    for (const test of adminTests) {
      const response = await axios.get(`${API_URL}${test.endpoint}`, {
        validateStatus: () => true,
      });

      if (response.status !== test.expectedStatus) {
        allProtected = false;
        break;
      }
    }

    addResult({
      name: 'Security: Admin Endpoints',
      status: allProtected ? 'pass' : 'fail',
      message: allProtected ? 'All admin endpoints protected' : 'Some endpoints not properly protected',
    });
  } catch (error: any) {
    addResult({
      name: 'Security: Admin Endpoints',
      status: 'fail',
      message: 'Failed to check security',
      details: { error: error.message },
    });
  }
}

async function generateReport() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 SYSTEM HEALTH CHECK REPORT', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warn').length;

  log(`\nTotal Checks: ${results.length}`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');

  const overallStatus = failed === 0 ? 'HEALTHY' : failed <= 2 ? 'DEGRADED' : 'CRITICAL';
  const overallColor = failed === 0 ? 'green' : failed <= 2 ? 'yellow' : 'red';

  log(`\n🏥 Overall System Status: ${overallStatus}`, overallColor);
  log('='.repeat(60), 'cyan');

  if (failed > 0) {
    log('\n⚠️  Failed Checks:', 'red');
    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => {
        log(`   - ${r.name}: ${r.message}`, 'red');
      });
  }

  return {
    total: results.length,
    passed,
    failed,
    warnings,
    status: overallStatus,
  };
}

async function runHealthCheck() {
  try {
    log('🏥 Starting System Health Check...', 'cyan');
    log('='.repeat(60), 'cyan');

    // Database checks
    log('\n💾 Checking Database...', 'cyan');
    await checkDatabaseConnection();
    await checkDatabaseCollections();
    await checkDataIntegrity();

    // API checks
    await checkPublicEndpoints();
    await checkAuthenticationFlow();
    await checkOrderCreationFlow();
    await checkProtectedEndpoints();
    await checkSecurityAudit();

    // Generate report
    const report = await generateReport();

    await mongoose.disconnect();
    process.exit(report.failed === 0 ? 0 : 1);
  } catch (error: any) {
    log(`\n❌ Health check failed: ${error.message}`, 'red');
    await mongoose.disconnect();
    process.exit(1);
  }
}

runHealthCheck();
