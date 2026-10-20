import { ApolloClient, ApolloLink, gql, InMemoryCache, Observable } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '@/locales/en/translation.json';
import { createErrorLink } from './error-link';
import i18n from './i18n';

const PING = gql`
  mutation Ping {
    ping
  }
`;

const PONG: ApolloLink.Result = { data: { ping: 'pong' } };

function refusal(code: string): ApolloLink.Result {
  return { data: null, errors: [{ message: 'Text that the server wrote', extensions: { code } }] };
}

/** The server accepts the renewed token and refuses every other one */
function acceptsFreshToken(authorization: string): ApolloLink.Result {
  return authorization === 'Bearer fresh' ? PONG : refusal('UNAUTHENTICATED');
}

function authorizationOf(operation: ApolloLink.Operation): string {
  const headers: unknown = operation.getContext().headers;
  if (
    typeof headers === 'object' &&
    headers !== null &&
    'authorization' in headers &&
    typeof headers.authorization === 'string'
  ) {
    return headers.authorization;
  }
  return '';
}

interface Scene {
  /** The access token in use, null when none is */
  token: string | null;
  /** What the server answers to a request that carries this Authorization header */
  answer: (authorization: string) => ApolloLink.Result | Error;
  /** What the server answers to the request for a new access token */
  renew?: () => Promise<string | null>;
}

/** The link in front of a client, with the link that sets the Authorization header and a server that records what it receives */
function setUp({ token, answer, renew = async () => 'fresh' }: Scene) {
  let inUse = token;
  const received: string[] = [];
  const notify = vi.fn<(message: string) => void>();
  const renewToken = vi.fn(renew);
  const storeToken = vi.fn((fresh: string) => {
    inUse = fresh;
  });
  const endSession = vi.fn<() => void>();

  const errorLink = createErrorLink({
    t: i18n.getFixedT('en'),
    notify,
    readToken: () => inUse,
    renewToken,
    storeToken,
    endSession,
  });
  const authLink = new ApolloLink((operation, forward) => {
    operation.setContext({ headers: { authorization: inUse === null ? '' : `Bearer ${inUse}` } });
    return forward(operation);
  });
  const serverLink = new ApolloLink(
    (operation) =>
      new Observable<ApolloLink.Result>((observer) => {
        const authorization = authorizationOf(operation);
        received.push(authorization);
        const response = answer(authorization);
        if (response instanceof Error) {
          observer.error(response);
          return;
        }
        observer.next(response);
        observer.complete();
      })
  );
  const client = new ApolloClient({
    link: ApolloLink.from([errorLink, authLink, serverLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { errorPolicy: 'all' },
      query: { errorPolicy: 'all' },
      mutate: { errorPolicy: 'all' },
    },
  });

  return { client, received, notify, renewToken, storeToken, endSession };
}

describe('the error link of the admin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // WHEN a request is refused with the code UNAUTHENTICATED while an access token is in use and the server issues a new token
  // THEN the new token is stored and the request is repeated with it
  // AND the caller receives the result of the repeated request
  // AND no toast is shown
  it('Scenario: A refused request is repeated once with a renewed access token', async () => {
    const { client, received, notify, renewToken, storeToken } = setUp({
      token: 'stale',
      answer: acceptsFreshToken,
    });

    const result = await client.mutate({ mutation: PING });

    expect(storeToken).toHaveBeenCalledExactlyOnceWith('fresh');
    expect(received).toEqual(['Bearer stale', 'Bearer fresh']);
    expect(result.data).toEqual({ ping: 'pong' });
    expect(result.error).toBeUndefined();
    expect(renewToken).toHaveBeenCalledOnce();
    expect(notify).not.toHaveBeenCalled();
  });

  // WHEN two requests are refused with the code UNAUTHENTICATED while the first renewal is still running
  // THEN the server is asked for a new token once
  // AND both requests are repeated with the new token
  it('Scenario: Requests refused together share one renewal', async () => {
    let finishRenewal: (token: string | null) => void = () => undefined;
    const renewal = new Promise<string | null>((resolve) => {
      finishRenewal = resolve;
    });
    const { client, received, renewToken, storeToken } = setUp({
      token: 'stale',
      answer: acceptsFreshToken,
      renew: () => renewal,
    });

    const first = client.mutate({ mutation: PING });
    const second = client.mutate({ mutation: PING });
    await vi.waitFor(() => expect(received).toHaveLength(2));
    finishRenewal('fresh');
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(renewToken).toHaveBeenCalledOnce();
    expect(storeToken).toHaveBeenCalledOnce();
    expect(received).toEqual(['Bearer stale', 'Bearer stale', 'Bearer fresh', 'Bearer fresh']);
    expect(firstResult.data).toEqual({ ping: 'pong' });
    expect(secondResult.data).toEqual({ ping: 'pong' });
  });

  // WHEN a request is refused with the code UNAUTHENTICATED while no access token is in use
  // THEN the server is not asked for a new token
  // AND the app shows a toast with the text of apiError.unauthenticated
  it('Scenario: A refused sign-in does not ask for a renewal', async () => {
    const { client, received, notify, renewToken } = setUp({
      token: null,
      answer: () => refusal('UNAUTHENTICATED'),
    });

    const result = await client.mutate({ mutation: PING });

    expect(renewToken).not.toHaveBeenCalled();
    expect(received).toHaveLength(1);
    expect(notify).toHaveBeenCalledExactlyOnceWith(en.apiError.unauthenticated);
    expect(CombinedGraphQLErrors.is(result.error)).toBe(true);
  });

  // WHEN a request is refused with the code UNAUTHENTICATED while an access token is in use and the server issues no new token
  // THEN the session ends
  // AND the refused request is not repeated and its caller receives the refusal
  it('Scenario: A failed renewal ends the session', async () => {
    const { client, received, notify, storeToken, endSession } = setUp({
      token: 'stale',
      answer: () => refusal('UNAUTHENTICATED'),
      renew: async () => null,
    });

    const result = await client.mutate({ mutation: PING });

    expect(endSession).toHaveBeenCalledOnce();
    expect(storeToken).not.toHaveBeenCalled();
    expect(received).toEqual(['Bearer stale']);
    expect(CombinedGraphQLErrors.is(result.error)).toBe(true);
    expect(notify).not.toHaveBeenCalled();
  });

  it('ends the session when the request for a new token fails', async () => {
    const { client, received, storeToken, endSession } = setUp({
      token: 'stale',
      answer: () => refusal('UNAUTHENTICATED'),
      renew: async () => {
        throw new Error('The refresh token is not valid');
      },
    });

    const result = await client.mutate({ mutation: PING });

    expect(endSession).toHaveBeenCalledOnce();
    expect(storeToken).not.toHaveBeenCalled();
    expect(received).toEqual(['Bearer stale']);
    expect(CombinedGraphQLErrors.is(result.error)).toBe(true);
  });

  // WHEN a request fails with the code CONFLICT
  // THEN the app shows a toast with the text of apiError.conflict
  // AND the server is not asked for a new token
  it('Scenario: An error of another code is shown as the text of its code', async () => {
    const { client, notify, renewToken } = setUp({
      token: 'stale',
      answer: () => refusal('CONFLICT'),
    });

    const result = await client.mutate({ mutation: PING });

    expect(notify).toHaveBeenCalledExactlyOnceWith(en.apiError.conflict);
    expect(renewToken).not.toHaveBeenCalled();
    expect(CombinedGraphQLErrors.is(result.error)).toBe(true);
  });

  // WHEN a request fails because the connection is lost
  // THEN the app shows a toast with the network text of the catalog
  it('Scenario: A network failure is shown as a connection problem', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { client, notify, renewToken } = setUp({
      token: 'stale',
      answer: () => new TypeError('Failed to fetch'),
    });

    const result = await client.mutate({ mutation: PING });

    expect(result.error).toBeInstanceOf(TypeError);
    expect(notify).toHaveBeenCalledExactlyOnceWith(en.apiError.network);
    expect(renewToken).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledExactlyOnceWith('[Network error]: Failed to fetch');
  });
});
