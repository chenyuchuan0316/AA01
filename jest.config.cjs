/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.(js|ts)'],
  setupFilesAfterEnv: [path.resolve(__dirname, 'test', 'setup-tests.cjs')],
  collectCoverage: true,
  coverageProvider: 'v8',
  transform: {
    '^.+\\.(ts|tsx|mjs)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: path.resolve(__dirname, 'tsconfig.test.json')
      }
    ]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'cjs', 'mjs', 'json'],
  collectCoverageFrom: [
    'scripts/**/*.{mjs,js,ts}',
    'src/**/*.{js,ts}',
    '!scripts/**/*.d.ts',
    '!scripts/auto-repair.mjs',
    '!scripts/health-check.mjs',
    '!scripts/run-pa11y.mjs',
    '!**/fixtures/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  clearMocks: true
};
