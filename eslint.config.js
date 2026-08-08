import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      '.wrangler/**',
      'legacy/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'src/visual/runtime.js',
      // Isolated design-preview trees merged from the Impeccable programme.
      // They are self-contained browser artifacts with their own conventions,
      // not production source, and they are not built or shipped by this
      // repository. Linting them under the production config reports hundreds
      // of browser/Node-global errors that say nothing about the product.
      'prototypes/**',
      'output/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.browser },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['tests/**/*.js', '*.config.js', 'scripts/**/*.mjs', 'tools/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
];
