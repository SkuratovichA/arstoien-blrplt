import { ApolloClient, ApolloLink, InMemoryCache, split } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { createClient } from 'graphql-ws';
import { env } from './env';

const httpLink = new UploadHttpLink({
  uri: env.apiUrl,
  credentials: 'include',
}) as unknown as ApolloLink;

const wsLink = new GraphQLWsLink(
  createClient({
    url: env.wsUrl,
  })
);

const errorLink = onError((options) => {
  const { graphQLErrors, networkError } = options as {
    graphQLErrors?: ReadonlyArray<{ message: string; locations?: unknown; path?: unknown }>;
    networkError?: Error;
  };

  if (graphQLErrors) {
    graphQLErrors.forEach((error) =>
      console.error(
        `[GraphQL error]: Message: ${error.message}, Location: ${error.locations}, Path: ${error.path}`
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
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
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
