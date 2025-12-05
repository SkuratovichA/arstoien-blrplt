const { eslintrc } = require('@arstoien/devtools');

module.exports = [
  ...eslintrc,
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.ts',
      '**/codegen.ts',
      '**/vite.config.ts',
      '**/tailwind.config.ts',
      '**/postcss.config.js',
      '**/i18next-parser.config.cjs',
      '**/.eslintrc.js',
      '**/.eslintrc.cjs'
    ]
  }
];