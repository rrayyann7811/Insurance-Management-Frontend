import globals from 'globals';

export default [{
  files: ['**/*.{js,jsx,mjs}'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
    globals: { ...globals.node, ...globals.browser },
  },
  rules: {
    'no-debugger': 'error',
    'no-dupe-keys': 'error',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^[A-Z]' }],
  },
}];
