import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.CI
    ? './schema.graphql'
    : process.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
  documents: ['src/**/*.graphql.ts'],
  ignoreNoDocuments: true,
  hooks: {
    // The client preset opens each file with a one-line linter directive, which Biome does not read
    beforeOneFileWrite: [
      (_path: string, content: string) => content.replace(/^\/\*[^\n]*\*\/\n/, ''),
    ],
  },
  generates: {
    'schema.graphql': {
      plugins: ['schema-ast'],
    },
    './src/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
        // The server sends both date scalars as ISO strings; without a mapping the generated types are unknown
        scalars: { Date: 'string', DateTime: 'string' },
      },
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};

export default config;
