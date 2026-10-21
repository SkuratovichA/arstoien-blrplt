import type { TypedDocumentNode } from '@apollo/client';
import { ApolloClient, ApolloLink, gql, InMemoryCache, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { createClient } from 'graphql-ws';
import toast from 'react-hot-toast';
import { useAuthStore } from './auth-store';
import { env } from './env';
import { createErrorLink } from './error-link';
import i18n from './i18n';

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().token;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const REFRESH_TOKEN_MUTATION: TypedDocumentNode<{ refresh: string }> = gql`
  mutation RefreshToken {
    refresh
  }
`;

// A client of its own, so that the refusal of a renewal does not reach the error link; a refused renewal must reject, so that the session ends
const renewalClient = new ApolloClient({
  link: ApolloLink.from([
    new UploadHttpLink({
      uri: env.graphqlUrl,
      credentials: 'include',
    }),
  ]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'none' },
    query: { errorPolicy: 'none' },
    mutate: { errorPolicy: 'none' },
  },
});

const errorLink = createErrorLink({
  t: i18n.t,
  notify: (message) => toast.error(message),
  readToken: () => useAuthStore.getState().token,
  renewToken: async () => {
    const { data } = await renewalClient.mutate({ mutation: REFRESH_TOKEN_MUTATION });
    return data?.refresh ?? null;
  },
  storeToken: (token) => {
    localStorage.setItem('accessToken', token);
    useAuthStore.getState().setToken(token);
  },
  endSession: () => {
    useAuthStore.getState().clearAuth();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  },
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
