import { ApolloClient, ApolloLink, InMemoryCache, split, gql, Observable} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink, onError } from '@apollo/client/link/error';
import { env } from './env';
import { useAuthStore } from './auth-store';
import toast from 'react-hot-toast';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import ErrorHandlerOptions = ErrorLink.ErrorHandlerOptions;

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().token;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Token refresh mutation
const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refresh
  }
`;

let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

const resolvePendingRequests = () => {
  pendingRequests.map((callback) => callback());
  pendingRequests = [];
};

const errorLink = onError((options) => {
  const { graphQLErrors, networkError, operation, forward } = options as {
    graphQLErrors?: ReadonlyArray<{ message: string; extensions?: { code?: string } }>;
    networkError?: Error;
  } & ErrorHandlerOptions;

  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Handle token refresh
        if (!isRefreshing) {
          isRefreshing = true;

          // Create a temporary Apollo Client for the refresh request
          const refreshClient = new ApolloClient({
            link: ApolloLink.from([
              new UploadHttpLink({
                uri: env.graphqlUrl,
                credentials: 'include',
              }),
            ]),
            cache: new InMemoryCache(),
          });

          return new Observable((observer) => {
            refreshClient
              .mutate({
                mutation: REFRESH_TOKEN_MUTATION,
              })
              .then(({ data }) => {
                const responseData = data as { refresh: string } | null;
                const newToken = responseData?.refresh;
                if (newToken) {
                  // Store the new token
                  localStorage.setItem('accessToken', newToken);
                  useAuthStore.getState().setToken(newToken);

                  isRefreshing = false;
                  resolvePendingRequests();

                  // Retry the original operation with new token
                  const oldHeaders = operation.getContext().headers;
                  operation.setContext({
                    headers: {
                      ...oldHeaders,
                      authorization: `Bearer ${newToken}`,
                    },
                  });

                  forward(operation).subscribe(observer);
                } else {
                  observer.error(new Error('No refresh token received'));
                }
              })
              .catch(() => {
                // Refresh failed, redirect to login
                isRefreshing = false;
                pendingRequests = [];
                useAuthStore.getState().clearAuth();
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                observer.complete();
              });
          });
        } else {
          // If already refreshing, queue this request
          return new Observable((observer) => {
            pendingRequests.push(() => {
              // Retry with potentially new token
              const token = localStorage.getItem('accessToken');
              if (token) {
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: `Bearer ${token}`,
                  },
                });
              }
              forward(operation).subscribe(observer);
            });
          });
        }
      } else {
        // Show error toast for non-auth errors
        toast.error(err.message);
      }
    }
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError.message}`);
    toast.error('Network error. Please check your connection.');
  }
});

const uploadLink = new UploadHttpLink({
  uri: env.graphqlUrl,
  credentials: 'include',
  headers: {
    'Apollo-Require-Preflight': 'true',
  },
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: env.wsUrl,
    connectionParams: () => {
      const token = localStorage.getItem('accessToken');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
    on: {
      connected: () => console.debug('WebSocket connected'),
      error: (error) => console.error('WebSocket error:', error),
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  ApolloLink.from([errorLink, authLink, uploadLink as unknown as ApolloLink])
);

const cache = new InMemoryCache({
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
              nodes: [...(existing?.nodes ?? []), ...incoming.nodes],
            };
          },
        },
      },
    },
  },
});

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache,
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
