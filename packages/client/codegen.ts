import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:4000/graphql',
  documents: ['src/**/*.graphql.ts'],
  ignoreNoDocuments: true,
  generates: {
    'schema.graphql': {
      plugins: ['schema-ast'],
    },
    './src/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};

export default config;
