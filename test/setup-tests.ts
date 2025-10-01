import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */
