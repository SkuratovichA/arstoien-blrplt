import '@apollo/client';

// Apollo Client 4 types the results of the hooks from the default options, so the error policies that lib/apollo-client.ts sets are declared here once. 'none' stays allowed for the client that refreshes the token, so that a failed refresh rejects.
declare module '@apollo/client' {
  namespace ApolloClient {
    namespace DeclareDefaultOptions {
      interface WatchQuery {
        errorPolicy: 'all' | 'none';
      }
      interface Query {
        errorPolicy: 'all' | 'none';
      }
      interface Mutate {
        errorPolicy: 'all' | 'none';
      }
    }
  }
}
