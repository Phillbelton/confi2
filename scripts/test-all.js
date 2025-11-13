#!/usr/bin/env node

/**
 * CONFITERÍA QUELITA - AUTOMATED TESTING SCRIPT
 *
 * Tests all backend endpoints, frontend pages, and critical flows
 * Usage: node scripts/test-all.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = `${BACKEND_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Helper: HTTP request
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 10000,
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? (res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data) : null,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Helper: Log test result
function logTest(name, passed, message = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } else {
    results.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.red}${message}${colors.reset}`);
  }
  results.tests.push({ name, passed, message });
}

// Helper: Section header
function section(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Test: Service is running
async function testServiceRunning(name, url) {
  try {
    const res = await request(url, { timeout: 5000 });
    logTest(`${name} is running`, res.status === 200 || res.status === 404);
    return true;
  } catch (error) {
    logTest(`${name} is running`, false, `${error.message}`);
    return false;
  }
}

// Test: API endpoint
async function testEndpoint(name, url, options = {}) {
  try {
    const res = await request(url, options);
    const expectedStatus = options.expectedStatus || 200;

    // Handle both single status code and array of status codes
    const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const passed = expectedStatuses.includes(res.status);

    const expectedStr = Array.isArray(expectedStatus) ? expectedStatus.join(' or ') : expectedStatus;
    logTest(name, passed, passed ? '' : `Expected ${expectedStr}, got ${res.status}`);
    return { passed, response: res };
  } catch (error) {
    logTest(name, false, error.message);
    return { passed: false, error };
  }
}

// Test: Frontend page
async function testPage(name, url) {
  try {
    const res = await request(url, { timeout: 5000 });
    const passed = res.status === 200 && (res.data?.includes('<!DOCTYPE html') || res.data?.includes('<html'));
    logTest(name, passed, passed ? '' : `Got status ${res.status}`);
    return passed;
  } catch (error) {
    logTest(name, false, error.message);
    return false;
  }
}

// Main test suite
async function runTests() {
  console.log(`${colors.blue}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     CONFITERÍA QUELITA - AUTOMATED TEST SUITE             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // ============================================================================
  // 1. SERVICE HEALTH CHECKS
  // ============================================================================
  section('1. SERVICE HEALTH CHECKS');

  const backendRunning = await testServiceRunning('Backend', `${BACKEND_URL}/health`);
  const frontendRunning = await testServiceRunning('Frontend', FRONTEND_URL);

  if (!backendRunning) {
    console.log(`\n${colors.red}⚠️  Backend is not running. Please start with: cd backend && npm run dev${colors.reset}`);
  }

  if (!frontendRunning) {
    console.log(`\n${colors.red}⚠️  Frontend is not running. Please start with: cd frontend && npm run dev${colors.reset}`);
  }

  // ============================================================================
  // 2. BACKEND API TESTS
  // ============================================================================
  if (backendRunning) {
    section('2. BACKEND API TESTS');

    // Categories
    await testEndpoint('GET /api/categories', `${API_URL}/categories`);
    await testEndpoint('GET /api/categories/main', `${API_URL}/categories/main`);

    // Brands
    await testEndpoint('GET /api/brands', `${API_URL}/brands`);

    // Products
    await testEndpoint('GET /api/products/parents', `${API_URL}/products/parents`);
    await testEndpoint('GET /api/products/parents/featured', `${API_URL}/products/parents/featured`);

    // Orders (public endpoints)
    const orderNumber = 'ORD-00001';
    await testEndpoint('GET /api/orders/number/:orderNumber', `${API_URL}/orders/number/${orderNumber}`, {
      expectedStatus: [200, 404],
    });

    // Auth endpoints
    await testEndpoint('POST /api/auth/login (invalid)', `${API_URL}/auth/login`, {
      method: 'POST',
      body: { email: 'test@test.com', password: 'wrong' },
      expectedStatus: [401, 400],
    });

    // Health/Status
    await testEndpoint('GET /api/health', `${BACKEND_URL}/health`);
  }

  // ============================================================================
  // 3. FRONTEND PAGE TESTS
  // ============================================================================
  if (frontendRunning) {
    section('3. FRONTEND PAGE TESTS - PUBLIC');

    await testPage('Home page', FRONTEND_URL);
    await testPage('Products page', `${FRONTEND_URL}/productos`);
    await testPage('Checkout page', `${FRONTEND_URL}/checkout`);

    section('3. FRONTEND PAGE TESTS - ADMIN');

    await testPage('Admin login page', `${FRONTEND_URL}/admin/login`);
    // Note: Protected routes will redirect to login if not authenticated
    await testPage('Admin dashboard (may redirect)', `${FRONTEND_URL}/admin/dashboard`);
    await testPage('Admin orders (may redirect)', `${FRONTEND_URL}/admin/pedidos`);
    await testPage('Admin products (may redirect)', `${FRONTEND_URL}/admin/productos`);
  }

  // ============================================================================
  // 4. INTEGRATION TESTS
  // ============================================================================
  if (backendRunning) {
    section('4. INTEGRATION TESTS');

    // Test product with variants
    const productsRes = await testEndpoint('Fetch products for integration test', `${API_URL}/products/parents?limit=1`);

    if (productsRes.passed && productsRes.response?.data?.data?.length > 0) {
      const product = productsRes.response.data.data[0];
      await testEndpoint(`Fetch variants for product: ${product.name}`, `${API_URL}/products/parents/${product._id}/variants`);
    }

    // Test category with products
    const categoriesRes = await testEndpoint('Fetch categories for integration test', `${API_URL}/categories`);

    if (categoriesRes.passed && categoriesRes.response?.data?.data?.length > 0) {
      const category = categoriesRes.response.data.data[0];
      await testEndpoint(`Fetch products in category: ${category.name}`, `${API_URL}/products/parents?category=${category._id}`);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  section('TEST SUMMARY');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);

  console.log(`Total Tests:  ${results.total}`);
  console.log(`${colors.green}Passed:       ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:       ${results.failed}${colors.reset}`);
  console.log(`Pass Rate:    ${passRate >= 80 ? colors.green : colors.yellow}${passRate}%${colors.reset}\n`);

  if (results.failed > 0) {
    console.log(`${colors.yellow}Failed Tests:${colors.reset}`);
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
        if (t.message) console.log(`    ${t.message}`);
      });
    console.log();
  }

  // Overall result
  if (results.failed === 0) {
    console.log(`${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✓ ALL TESTS PASSED!                                      ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}║  ✗ SOME TESTS FAILED                                      ║${colors.reset}`);
    console.log(`${colors.red}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
