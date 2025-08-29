// @ts-check

import { default as eslint, default as js } from '@eslint/js';
import nodePlugin from 'eslint-plugin-n';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'bin',
      'build',
      'node_modules',
      'eslint.config.mjs',
      'jest.config.ts',
    ],
  },
  js.configs.recommended,
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    settings: {},
    rules: {},
  }
);
