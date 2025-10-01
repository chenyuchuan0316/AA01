import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jestPlugin from 'eslint-plugin-jest';
import playwrightPlugin from 'eslint-plugin-playwright';

const playwrightRecommended = playwrightPlugin.configs['flat/recommended'];
const playwrightTest = playwrightPlugin.configs['playwright-test'];

export default [
  {
    ignores: ['node_modules', 'coverage', 'playwright-report', 'playwright-results', 'dist']
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs,ts,tsx}']
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      jest: jestPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...jestPlugin.configs.recommended.rules,
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info']
        }
      ],
      'jest/expect-expect': [
        'error',
        {
          assertFunctionNames: ['expect', 'expectSoft', 'expect.poll']
        }
      ]
    }
  },
  {
    files: ['playwright/**/*.{js,ts}'],
    languageOptions: playwrightRecommended.languageOptions,
    plugins: playwrightRecommended.plugins,
    rules: {
      ...playwrightRecommended.rules,
      ...playwrightTest.rules
    }
  }
];
