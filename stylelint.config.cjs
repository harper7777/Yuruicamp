/**
 * Stylelint starts with standard SCSS rules while relaxing legacy selector naming.
 */
module.exports = {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**', 'node_modules/**', 'admin/**'],
  rules: {
    'selector-class-pattern': null,
    'no-descending-specificity': null,
  },
};
