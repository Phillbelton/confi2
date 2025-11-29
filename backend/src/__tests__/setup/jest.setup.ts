/**
 * Global Jest Setup for Tests
 *
 * This file runs before all tests and sets up:
 * - Mock services for external dependencies
 * - Global test configuration
 * - Cleanup handlers
 */

import { ENV } from '../../config/env';

// Verify we're in test environment
if (ENV.NODE_ENV !== 'test') {
  throw new Error('Jest setup should only run in test environment!');
}

// Mock external services
jest.mock('../../services/emailService');

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests:
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(), // Keep warnings visible
  error: jest.fn(), // Keep errors visible
};

// Global setup - runs once before all tests
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

// Global teardown - runs once after all tests
afterAll(() => {
  console.log('✅ Test suite complete');
});

// Setup before each test file
beforeEach(() => {
  // Clear all mocks before each test to prevent test pollution
  jest.clearAllMocks();
});

// Cleanup after each test file
afterEach(() => {
  // Additional cleanup if needed
});

export {};
