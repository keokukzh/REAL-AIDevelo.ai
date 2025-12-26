// Flat ESLint config for ESLint v9
// Mirrors prior .eslintrc.cjs behavior with TS + React Hooks + Prettier compatibility
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

const noConsoleRule =
  process.env.NODE_ENV === 'production' ? ['warn', { allow: ['warn', 'error'] }] : 'off';

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  files: ['**/*.{ts,tsx,js,jsx}'],
  plugins: {
    'react-hooks': reactHooks,
  },
  rules: {
    // React hooks best practices
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // Console policy
    'no-console': noConsoleRule,
    // API prefix is enforced via dedicated script `lint:api-prefix`.
  },
  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  ignores: ['dist/', 'node_modules/', '*.js', 'server/'],
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      project: './tsconfig.json',
      ecmaFeatures: { jsx: true },
    },
  },
});
