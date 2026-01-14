module.exports = {
  root: true,
  // Añade aquí los archivos que quieres que ESLint ignore por completo
  ignorePatterns: [
    '.eslintrc.js', 
    'jest.config.cjs', // <--- Añade esto
    'dist/', 
    'node_modules/'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'import/order': [
      'warn', 
      { 
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], 
        'newlines-between': 'always' 
      }
    ]
  }
};