import js from '@eslint/js';
import globals from 'globals';

/**
 * Keeps ESLint focused on syntax and maintainability without forcing a large legacy rewrite.
 */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'admin/**'],
  },
  js.configs.recommended,
  {
    files: ['js/**/*.js', 'booking/js/**/*.js', 'src/**/*.js', 'tests/**/*.mjs', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jquery,
        bootstrap: 'readonly',
        Chart: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
