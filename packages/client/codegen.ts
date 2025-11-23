import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  documents: ['src/**/*.graphql.ts'],
  generates: {
    './src/graphql/generated.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
      },
    },
    './src/graphql/introspection.json': {
      plugins: ['introspection'],
    },
  },
  ignoreNoDocuments: true,
};

export default config;
