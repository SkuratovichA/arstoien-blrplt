// This file is the same in packages/client/src/lib and in packages/admin/src/lib, and scripts/error-message-mirror.spec.ts fails when the two copies differ.
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import type { TFunction } from 'i18next';

/** The codes that the API names its errors with in extensions.code, see openspec/specs/error-codes/spec.md */
const API_ERROR_CODES = [
  'BAD_USER_INPUT',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_SERVER_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** The texts that a screen shows for some codes instead of the texts of the catalog */
export type OwnTexts = Partial<Record<ApiErrorCode, string>>;

function isApiErrorCode(code: unknown): code is ApiErrorCode {
  return API_ERROR_CODES.some((known) => known === code);
}

/** The code of the first error of the response; a code that is not on the list counts as INTERNAL_SERVER_ERROR */
function codeOf(error: CombinedGraphQLErrors): ApiErrorCode {
  const code: unknown = error.errors[0]?.extensions?.code;
  return isApiErrorCode(code) ? code : 'INTERNAL_SERVER_ERROR';
}

function retryAfterSecondsOf(error: CombinedGraphQLErrors): number | undefined {
  const seconds: unknown = error.errors[0]?.extensions?.retryAfterSeconds;
  return typeof seconds === 'number' && seconds > 0 ? seconds : undefined;
}

/**
 * The text to show for a failed request, in the language of t.
 * A failure without an error of the API, such as a lost connection, is a network problem.
 * Any other failure is shown as the text of its code, never as the message of the server, and own replaces the text of a code on one screen.
 */
export function errorMessageOf(error: unknown, t: TFunction, own: OwnTexts = {}): string {
  if (!CombinedGraphQLErrors.is(error)) {
    return t('apiError.network');
  }
  const code = codeOf(error);
  const ownText = own[code];
  if (ownText !== undefined) {
    return ownText;
  }
  switch (code) {
    case 'BAD_USER_INPUT':
      return t('apiError.badUserInput');
    case 'UNAUTHENTICATED':
      return t('apiError.unauthenticated');
    case 'FORBIDDEN':
      return t('apiError.forbidden');
    case 'NOT_FOUND':
      return t('apiError.notFound');
    case 'CONFLICT':
      return t('apiError.conflict');
    case 'RATE_LIMITED': {
      const seconds = retryAfterSecondsOf(error);
      return seconds === undefined
        ? t('apiError.rateLimited')
        : t('apiError.rateLimitedWait', { seconds });
    }
    case 'INTERNAL_SERVER_ERROR':
      return t('apiError.internal');
  }
}
