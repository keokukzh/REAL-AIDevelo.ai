/**
 * ESLint Configuration for Frontend
 * 
 * Prevents double /api/ prefix bugs in apiClient calls
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Prevent double /api/ prefix in apiClient calls
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.property.name=/^(get|post|put|patch|delete)$/][callee.object.name="apiClient"] > Literal[value=/^\\/api\\//]',
        message: 'Do not include /api/ prefix in apiClient calls. apiClient already uses /api as base URL. Use relative paths like "/analytics/calls/summary" instead of "/api/analytics/calls/summary".',
      },
      {
        selector: 'CallExpression[callee.property.name=/^(get|post|put|patch|delete)$/][callee.object.name="apiClient"] > TemplateLiteral > TemplateElement[value.raw=/\\/api\\//]',
        message: 'Do not include /api/ prefix in apiClient calls. apiClient already uses /api as base URL. Use relative paths like "/analytics/calls/summary" instead of "/api/analytics/calls/summary".',
      },
    ],
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', 'server/'],
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
};
