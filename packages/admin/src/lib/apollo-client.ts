import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { env } from './env';
import { useAuthStore } from './auth-store';

const httpLink = createHttpLink({
  uri: env.graphqlUrl,
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().token;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }

      // Handle authorization errors
      if (extensions?.code === 'FORBIDDEN') {
        console.error('Insufficient permissions');
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          users: {
            keyArgs: ['where', 'orderBy'],
            merge(existing, incoming, { args }) {
              if (!args?.skip) {
                return incoming;
              }
              return {
                ...incoming,
                nodes: [...(existing?.nodes || []), ...incoming.nodes],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
