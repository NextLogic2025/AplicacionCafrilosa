/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.expo/', '.cache/', 'coverage/'],
  env: { es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'react', 'react-hooks', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
    'import/ignore': ['^react-native$'],
    'import/resolver': {
      node: { extensions: ['.js', '.cjs', '.ts', '.tsx'] },
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  },
  overrides: [
    {
      files: ['frontend/web/**/*.{ts,tsx}', 'frontend/web/**/vite*.ts'],
      env: { browser: true },
      rules: {
        // En React + TS usamos tipos en lugar de prop-types.
        'react/prop-types': 'off',
      },
    },
    {
      files: ['frontend/mobile/**/*.{ts,tsx,js}'],
      // Reglas específicas RN (sin exigirlo en web).
      rules: {
        // Metro + RN usan exports que el plugin-import intenta “parsear” desde node_modules (Flow), causando falsos positivos.
        'import/namespace': 'off',
        'import/no-unresolved': 'off',
        // React Navigation usa `children` prop como API.
        'react/no-children-prop': 'off',
        'react-native/no-inline-styles': 'off',
      },
    },
    {
      files: ['**/*.cjs', '**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    {
      files: ['frontend/web/vite.config.ts'],
      rules: {
        // `@tailwindcss/vite` es ESM/dynamic import: el resolver de eslint-import no siempre lo detecta en Windows.
        'import/no-unresolved': 'off',
      },
    },
    {
      files: ['frontend/mobile/src/assets/**/*.ts'],
      rules: {
        // RN usa `require()` para assets estáticos.
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
}
