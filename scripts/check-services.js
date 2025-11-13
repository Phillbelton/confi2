#!/usr/bin/env node

/**
 * CONFITERÍA QUELITA - SERVICE HEALTH CHECK (Cross-platform)
 *
 * Checks all required services before running tests
 * Works on Windows, Linux, and macOS
 * Usage: node scripts/check-services.js
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Colors (work in most terminals including Windows 10+)
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const isWindows = process.platform === 'win32';

// Helper to check if command exists
function commandExists(command) {
  return new Promise((resolve) => {
    const cmd = isWindows ? 'where' : 'which';
    exec(`${cmd} ${command}`, (error) => {
      resolve(!error);
    });
  });
}

// Helper to get command version
function getVersion(command, arg = '--version') {
  return new Promise((resolve) => {
    exec(`${command} ${arg}`, (error, stdout) => {
      if (error) {
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Helper to check if process is running
function isProcessRunning(processName) {
  return new Promise((resolve) => {
    const cmd = isWindows
      ? `tasklist /FI "IMAGENAME eq ${processName}.exe"`
      : `pgrep -x ${processName}`;

    exec(cmd, (error, stdout) => {
      if (isWindows) {
        resolve(stdout.includes(processName));
      } else {
        resolve(!error && stdout.trim().length > 0);
      }
    });
  });
}

// Helper to check HTTP endpoint
function checkEndpoint(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Helper to check if directory exists
function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

// Helper to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

// Print check result
function printCheck(name, passed, extra = '') {
  const status = passed
    ? `${colors.green}✓${colors.reset}`
    : `${colors.red}✗${colors.reset}`;
  console.log(`${status} ${name}${extra ? ' ' + extra : ''}`);
  return passed;
}

// Main check function
async function checkServices() {
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}  🍬 Confitería Quelita - Service Health Check${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  let allOk = true;

  // Check Node.js
  const nodeExists = await commandExists('node');
  if (nodeExists) {
    const version = await getVersion('node', '--version');
    allOk &= printCheck('Node.js', true, `(${version})`);
  } else {
    allOk &= printCheck('Node.js', false);
  }

  // Check npm
  const npmExists = await commandExists('npm');
  if (npmExists) {
    const version = await getVersion('npm', '--version');
    allOk &= printCheck('npm', true, `(v${version})`);
  } else {
    allOk &= printCheck('npm', false);
  }

  // Check MongoDB
  const mongoRunning =
    (await isProcessRunning('mongod')) || (await isProcessRunning('mongodb'));
  allOk &= printCheck('MongoDB', mongoRunning);
  if (!mongoRunning) {
    console.log(`  ${colors.yellow}Start MongoDB from Services or MongoDB Compass${colors.reset}`);
  }

  // Check Backend
  const backendRunning = await checkEndpoint('http://localhost:5000/health');
  allOk &= printCheck('Backend (http://localhost:5000)', backendRunning);
  if (!backendRunning) {
    console.log(`  ${colors.yellow}Start with: cd backend && npm run dev${colors.reset}`);
  }

  // Check Frontend
  const frontendRunning = await checkEndpoint('http://localhost:3000');
  allOk &= printCheck('Frontend (http://localhost:3000)', frontendRunning);
  if (!frontendRunning) {
    console.log(`  ${colors.yellow}Start with: cd frontend && npm run dev${colors.reset}`);
  }

  // Check Backend dependencies
  const backendDeps = dirExists(path.join(__dirname, '..', 'backend', 'node_modules'));
  allOk &= printCheck('Backend dependencies', backendDeps);
  if (!backendDeps) {
    console.log(`  ${colors.yellow}Install with: cd backend && npm install${colors.reset}`);
  }

  // Check Frontend dependencies
  const frontendDeps = dirExists(path.join(__dirname, '..', 'frontend', 'node_modules'));
  allOk &= printCheck('Frontend dependencies', frontendDeps);
  if (!frontendDeps) {
    console.log(`  ${colors.yellow}Install with: cd frontend && npm install${colors.reset}`);
  }

  // Check Backend .env
  const backendEnv = fileExists(path.join(__dirname, '..', 'backend', '.env'));
  printCheck('Backend .env', backendEnv);
  if (!backendEnv) {
    console.log(`  ${colors.yellow}Copy from: backend/.env.example${colors.reset}`);
  }

  // Check Frontend .env.local
  const frontendEnv = fileExists(path.join(__dirname, '..', 'frontend', '.env.local'));
  printCheck('Frontend .env.local (optional)', frontendEnv);

  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  if (allOk) {
    console.log(`${colors.green}✓ All critical services are ready!${colors.reset}`);
    console.log(`${colors.green}  You can run tests with: npm test${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some services are not ready${colors.reset}`);
    console.log(`${colors.yellow}  Fix the issues above before running tests${colors.reset}\n`);
    process.exit(1);
  }
}

// Run checks
checkServices().catch((error) => {
  console.error(`${colors.red}Error:${colors.reset}`, error.message);
  process.exit(1);
});
