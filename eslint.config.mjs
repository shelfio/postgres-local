import tsRules from '@shelf/eslint-config/typescript.js';

export default [
  {files: ['**/*.js', '**/*.json', '**/*.ts']},
  ...tsRules,
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/',
      '**/coverage/',
      '**/lib/',
      'renovate.json',
      'tsconfig.json',
      'package.json',
    ],
  },
];
