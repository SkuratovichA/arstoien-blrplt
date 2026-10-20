import { HttpStatus, Logger, type ValidationError } from '@nestjs/common';
import { type MockInstance } from 'vitest';
import { validationException } from './validation-exception.js';

const REJECTED_EMAIL = 'nobody-at-example.test';
const REJECTED_PASSWORD = 'Sh0rt-pw';

const PASSWORD_FAILURE: ValidationError = {
  property: 'password',
  value: REJECTED_PASSWORD,
  constraints: {
    minLength: 'password must be longer than or equal to 12 characters',
    matches: 'password must contain a digit',
  },
};

const NESTED_EMAIL_FAILURE: ValidationError = {
  property: 'input',
  children: [
    {
      property: 'email',
      value: REJECTED_EMAIL,
      constraints: { isEmail: 'email must be an email' },
    },
  ],
};

describe('validationException', () => {
  let warn: MockInstance<Logger['warn']>;

  beforeEach(() => {
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers the status 400 with the first failure as the message', () => {
    const exception = validationException([PASSWORD_FAILURE, NESTED_EMAIL_FAILURE]);

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.message).toBe('password must be longer than or equal to 12 characters');
  });

  it('logs each failed field once, and a field of a nested input by its path', () => {
    validationException([PASSWORD_FAILURE, NESTED_EMAIL_FAILURE]);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toBe('Validation failed for password, input.email');
  });

  it('repeats no rejected value in the exception or in the log', () => {
    const exception = validationException([PASSWORD_FAILURE, NESTED_EMAIL_FAILURE]);

    const shown = JSON.stringify([exception.getResponse(), exception.message, warn.mock.calls]);
    expect(shown).not.toContain(REJECTED_PASSWORD);
    expect(shown).not.toContain(REJECTED_EMAIL);
  });
});
