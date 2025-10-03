/* eslint-disable @typescript-eslint/no-require-imports */
require('@testing-library/jest-dom');
const { expect } = require('@jest/globals');
const { toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);
