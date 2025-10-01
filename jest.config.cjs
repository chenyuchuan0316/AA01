/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.(js|ts)'],
  setupFilesAfterEnv: [path.resolve(__dirname, 'test', 'setup-tests.ts')],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: path.resolve(__dirname, 'tsconfig.test.json')
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'cjs', 'mjs', 'json'],
  collectCoverageFrom: ['src/**/*.{js,ts}', '__tests__/**/*.{js,ts}', '!**/fixtures/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  clearMocks: true
};
