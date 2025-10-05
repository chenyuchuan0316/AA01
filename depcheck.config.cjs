/* eslint-disable @typescript-eslint/no-require-imports */
const depcheck = require('depcheck');

module.exports = {
  specials: [
    depcheck.special.bin,
    depcheck.special.jest,
    depcheck.special.eslint,
    depcheck.special.typescript,
    depcheck.special['lint-staged']
  ],
  ignores: [
    'cross-env',
    'husky',
    'jest-environment-jsdom',
    'jsdom',
    'lint-staged',
    'npm-run-all',
    'prettier',
    'ts-jest',
    'knip'
  ]
};
