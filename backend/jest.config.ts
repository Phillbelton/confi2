import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],

  // TypeScript configuration
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'ts-jest',
  },

  // Module resolution
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(isomorphic-dompurify|dompurify|parse5|jsdom|@jsdom)/)',
  ],

  // Setup and teardown
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/testDb.ts',
    '<rootDir>/src/__tests__/setup/jest.setup.ts',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/scripts/**',
    '!src/server.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Test execution
  testTimeout: 30000, // 30s for E2E tests with MongoDB Memory Server
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,

  // Run tests sequentially to avoid database conflicts
  maxWorkers: 1,
};

export default config;
