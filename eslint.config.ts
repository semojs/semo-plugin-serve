// ./eslint.config.ts
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import vitest from '@vitest/eslint-plugin'

export default tseslint.config(
  // global
  {
    ignores: [
      '**/node_modules/**',
      '**/lib/**',
      '**/coverage/**',
      '**/.turbo/**',
      'pnpm-lock.yaml',
      '**/*.config.ts',
      '.vitepress/**/*',
      'example/**',
    ],
  },

  // basic
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // Node.js
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Typescript
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json', './tests/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Enable or disable as needed
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },

  // Vitest
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'], // Match test files
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },

  // Prettier
  eslintConfigPrettier
)
