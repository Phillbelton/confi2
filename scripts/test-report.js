#!/usr/bin/env node

/**
 * CONFITERÍA QUELITA - GENERATE TEST REPORT
 *
 * Generates HTML test report
 * Usage: node scripts/test-report.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = `${BACKEND_URL}/api`;

const results = {
  timestamp: new Date().toISOString(),
  total: 0,
  passed: 0,
  failed: 0,
  sections: [],
};

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

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

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data ? (res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data) : null,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function test(name, testFn) {
  results.total++;
  const startTime = Date.now();
  try {
    await testFn();
    results.passed++;
    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    results.failed++;
    return {
      name,
      passed: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

function section(name) {
  const sectionObj = { name, tests: [] };
  results.sections.push(sectionObj);
  return sectionObj;
}

async function runTests() {
  console.log('Running tests and generating report...\n');

  // Services
  const servicesSection = section('Service Health');
  servicesSection.tests.push(
    await test('Backend is running', async () => {
      const res = await request(`${BACKEND_URL}/health`, { timeout: 5000 });
      if (res.status !== 200) throw new Error('Backend not responding');
    })
  );
  servicesSection.tests.push(
    await test('Frontend is running', async () => {
      const res = await request(FRONTEND_URL, { timeout: 5000 });
      if (res.status !== 200) throw new Error('Frontend not responding');
    })
  );

  // API Endpoints
  const apiSection = section('API Endpoints');
  apiSection.tests.push(
    await test('GET /api/categories', async () => {
      const res = await request(`${API_URL}/categories`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!res.data?.success) throw new Error('Invalid response format');
    })
  );
  apiSection.tests.push(
    await test('GET /api/brands', async () => {
      const res = await request(`${API_URL}/brands`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    })
  );
  apiSection.tests.push(
    await test('GET /api/products/parents', async () => {
      const res = await request(`${API_URL}/products/parents`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    })
  );

  // Frontend Pages
  const frontendSection = section('Frontend Pages');
  frontendSection.tests.push(
    await test('Home page', async () => {
      const res = await request(FRONTEND_URL);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    })
  );
  frontendSection.tests.push(
    await test('Products page', async () => {
      const res = await request(`${FRONTEND_URL}/productos`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    })
  );
  frontendSection.tests.push(
    await test('Admin login page', async () => {
      const res = await request(`${FRONTEND_URL}/admin/login`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    })
  );

  return results;
}

function generateHTML(results) {
  const passRate = ((results.passed / results.total) * 100).toFixed(1);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report - Confitería Quelita</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .header p {
      opacity: 0.9;
      font-size: 1.1em;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .stat {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-value {
      font-size: 3em;
      font-weight: bold;
      margin: 10px 0;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .pass-rate {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .passed { color: #10b981; }
    .failed { color: #ef4444; }
    .section {
      padding: 30px 40px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section-title {
      font-size: 1.5em;
      margin-bottom: 20px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .test-list {
      list-style: none;
    }
    .test-item {
      padding: 15px;
      margin: 10px 0;
      background: #f9fafb;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-name {
      font-weight: 500;
      flex: 1;
    }
    .test-status {
      font-weight: bold;
      font-size: 1.2em;
    }
    .test-duration {
      color: #666;
      font-size: 0.85em;
      margin-left: 15px;
    }
    .test-error {
      color: #ef4444;
      font-size: 0.85em;
      margin-top: 5px;
      padding: 10px;
      background: #fee;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
    }
    @media (max-width: 768px) {
      .header h1 { font-size: 1.8em; }
      .stats { grid-template-columns: 1fr; }
      .section { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍬 Confitería Quelita</h1>
      <p>Automated Test Report</p>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total Tests</div>
        <div class="stat-value">${results.total}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Passed</div>
        <div class="stat-value passed">✓ ${results.passed}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Failed</div>
        <div class="stat-value failed">✗ ${results.failed}</div>
      </div>
      <div class="stat pass-rate">
        <div class="stat-label">Pass Rate</div>
        <div class="stat-value">${passRate}%</div>
      </div>
    </div>

    ${results.sections
      .map(
        (section) => `
      <div class="section">
        <h2 class="section-title">
          ${section.tests.every((t) => t.passed) ? '✓' : '⚠️'} ${section.name}
        </h2>
        <ul class="test-list">
          ${section.tests
            .map(
              (test) => `
            <li class="test-item">
              <div style="flex: 1;">
                <div class="test-name">
                  <span class="test-status ${test.passed ? 'passed' : 'failed'}">
                    ${test.passed ? '✓' : '✗'}
                  </span>
                  ${test.name}
                  <span class="test-duration">${test.duration}ms</span>
                </div>
                ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
              </div>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `
      )
      .join('')}

    <div class="footer">
      <p>Generated on ${new Date(results.timestamp).toLocaleString('es-AR')}</p>
      <p>Backend: ${BACKEND_URL} | Frontend: ${FRONTEND_URL}</p>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const testResults = await runTests();
  const html = generateHTML(testResults);

  const reportPath = path.join(__dirname, '..', 'test-report.html');
  fs.writeFileSync(reportPath, html);

  console.log(`✓ Test report generated: ${reportPath}`);
  console.log(`\nResults: ${testResults.passed}/${testResults.total} passed (${((testResults.passed / testResults.total) * 100).toFixed(1)}%)\n`);

  if (testResults.failed > 0) {
    console.log('Failed tests:');
    testResults.sections.forEach((section) => {
      section.tests
        .filter((t) => !t.passed)
        .forEach((t) => {
          console.log(`  ✗ ${section.name} > ${t.name}: ${t.error}`);
        });
    });
  }
}

main().catch(console.error);
