import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/.next/',
      '**/dist/',
      '**/coverage/',
      'infra/',
      '.CLAUDE/',
      '.claude/',
      'RECURSOS/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // CommonJS config files (commitlint, etc.): enable `module`/`require` globals.
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
);
