import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { createClient } from 'graphql-ws';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { env } from './env';

const httpLink = createUploadLink({
  uri: env.apiUrl,
  credentials: 'include',
}) as unknown as ApolloLink;

const wsLink = new GraphQLWsLink(
  createClient({
    url: env.wsUrl,
  })
);

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, splitLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
