import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { describe, expect, it } from 'vitest';
import cs from '../locales/cs/translation.json';
import en from '../locales/en/translation.json';
import sk from '../locales/sk/translation.json';
import { errorMessageOf } from './error-message';
import i18n from './i18n';

const SERVER_MESSAGE = 'Text that the server wrote';

const english = i18n.getFixedT('en');

/** A request that failed with one error of the API, which has this code and these extensions besides */
function failedWith(
  code?: string,
  extensions: Record<string, unknown> = {}
): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [
      {
        message: SERVER_MESSAGE,
        extensions: { ...(code === undefined ? {} : { code }), ...extensions },
      },
    ],
  });
}

describe('errorMessageOf', () => {
  // WHEN a request fails with an error whose code is CONFLICT
  // THEN the app shows the text of apiError.conflict in the language of the interface
  // AND it does not show the message of the server
  it('Scenario: A code is shown as the text of the catalog in the language of the interface', () => {
    const error = failedWith('CONFLICT');

    expect(errorMessageOf(error, i18n.getFixedT('en'))).toBe(en.apiError.conflict);
    expect(errorMessageOf(error, i18n.getFixedT('cs'))).toBe(cs.apiError.conflict);
    expect(errorMessageOf(error, i18n.getFixedT('sk'))).toBe(sk.apiError.conflict);
    expect(errorMessageOf(error, english)).not.toContain(SERVER_MESSAGE);
  });

  it.each([
    ['BAD_USER_INPUT', en.apiError.badUserInput],
    ['UNAUTHENTICATED', en.apiError.unauthenticated],
    ['FORBIDDEN', en.apiError.forbidden],
    ['NOT_FOUND', en.apiError.notFound],
    ['CONFLICT', en.apiError.conflict],
    ['RATE_LIMITED', en.apiError.rateLimited],
    ['INTERNAL_SERVER_ERROR', en.apiError.internal],
  ])('shows the text of the catalog for %s', (code, text) => {
    expect(errorMessageOf(failedWith(code), english)).toBe(text);
  });

  it('reads the code of the first error of the response', () => {
    const error = new CombinedGraphQLErrors({
      errors: [
        { message: SERVER_MESSAGE, extensions: { code: 'FORBIDDEN' } },
        { message: SERVER_MESSAGE, extensions: { code: 'CONFLICT' } },
      ],
    });

    expect(errorMessageOf(error, english)).toBe(en.apiError.forbidden);
  });

  // WHEN a screen gives its own text for UNAUTHENTICATED and a request fails with that code
  // THEN the app shows the text of the screen
  // AND an error with another code still shows the text of the catalog
  it("Scenario: A screen's own text for a code replaces the text of the catalog", () => {
    const own = { UNAUTHENTICATED: 'Text of the screen' };

    expect(errorMessageOf(failedWith('UNAUTHENTICATED'), english, own)).toBe('Text of the screen');
    expect(errorMessageOf(failedWith('CONFLICT'), english, own)).toBe(en.apiError.conflict);
  });

  // WHEN a request fails with the code RATE_LIMITED and retryAfterSeconds of 42
  // THEN the app shows a text that names 42 seconds
  // AND the same error without retryAfterSeconds shows a text without a number
  it('Scenario: A rate limit tells the seconds to wait', () => {
    const withWait = errorMessageOf(failedWith('RATE_LIMITED', { retryAfterSeconds: 42 }), english);
    const withoutWait = errorMessageOf(failedWith('RATE_LIMITED'), english);

    expect(withWait).toBe(en.apiError.rateLimitedWait.replace('{{seconds}}', '42'));
    expect(withWait).toContain('42');
    expect(withoutWait).toBe(en.apiError.rateLimited);
    expect(withoutWait).not.toMatch(/\d/);
  });

  // WHEN a request fails without any error of the API, for example because the connection is lost
  // THEN the app shows the network text of the catalog
  it('Scenario: A failure that did not come from the API is shown as a network problem', () => {
    expect(errorMessageOf(new TypeError('Failed to fetch'), english)).toBe(en.apiError.network);
    expect(errorMessageOf('connection lost', english)).toBe(en.apiError.network);
  });

  // WHEN a request fails with a code that is not on the list, or with INTERNAL_SERVER_ERROR
  // THEN the app shows the general text of the catalog
  it('Scenario: A code that the app does not know is shown as a general failure', () => {
    expect(errorMessageOf(failedWith('TEAPOT'), english)).toBe(en.apiError.internal);
    expect(errorMessageOf(failedWith('INTERNAL_SERVER_ERROR'), english)).toBe(en.apiError.internal);
    expect(errorMessageOf(failedWith(), english)).toBe(en.apiError.internal);
  });

  it('shows the own text of a screen for INTERNAL_SERVER_ERROR as the text of an unknown code', () => {
    const own = { INTERNAL_SERVER_ERROR: 'Text of the screen' };

    expect(errorMessageOf(failedWith('TEAPOT'), english, own)).toBe('Text of the screen');
  });
});
