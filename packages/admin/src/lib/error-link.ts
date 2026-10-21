import type { ApolloLink } from '@apollo/client';
import { Observable } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import type { TFunction } from 'i18next';
import { errorMessageOf } from './error-message';

export interface ErrorLinkDeps {
  /** Turns the code of an error into the text of the catalog, in the language of the interface */
  t: TFunction;
  /** Shows a text to the user */
  notify: (message: string) => void;
  /** The access token that requests carry, null when no user is signed in */
  readToken: () => string | null;
  /** Asks the server for a new access token and resolves null when the server issues none */
  renewToken: () => Promise<string | null>;
  storeToken: (token: string) => void;
  endSession: () => void;
}

/**
 * The link that shows a failed request as the text of its code, and that renews an access token the server refused.
 * A request refused as UNAUTHENTICATED while a token is in use is repeated once with a new token, and the requests refused together share one renewal.
 * Without a new token the session ends and the caller receives the refusal.
 * The repeated request is not looked at again: a second refusal reaches its caller as it is.
 */
export function createErrorLink({
  t,
  notify,
  readToken,
  renewToken,
  storeToken,
  endSession,
}: ErrorLinkDeps): ErrorLink {
  let renewal: Promise<string | null> | null = null;

  const renew = (): Promise<string | null> => {
    renewal ??= renewToken()
      .catch(() => null)
      .then((token) => {
        if (token === null) {
          endSession();
        } else {
          storeToken(token);
        }
        return token;
      })
      .finally(() => {
        renewal = null;
      });
    return renewal;
  };

  return new ErrorLink(({ error, result, operation, forward }) => {
    const refused =
      CombinedGraphQLErrors.is(error) && error.errors[0]?.extensions?.code === 'UNAUTHENTICATED';
    if (!refused || result === undefined || readToken() === null) {
      if (!CombinedGraphQLErrors.is(error)) {
        console.error(`[Network error]: ${error.message}`);
      }
      notify(errorMessageOf(error, t));
      return;
    }
    return new Observable<ApolloLink.Result>((observer) => {
      let repeated: { unsubscribe(): void } | undefined;
      let abandoned = false;
      renew().then((token) => {
        if (abandoned) {
          return;
        }
        if (token === null) {
          observer.next(result);
          observer.complete();
        } else {
          repeated = forward(operation).subscribe(observer);
        }
      });
      return () => {
        abandoned = true;
        repeated?.unsubscribe();
      };
    });
  });
}
