import { errorMessage, NotFoundError } from './errors.js';

describe('errorMessage', () => {
  it('returns the message of an Error, whatever the fallback', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage(new Error('boom'), 'Unknown error')).toBe('boom');
  });

  it('returns the message of a tagged domain error', () => {
    expect(errorMessage(new NotFoundError({ message: 'No such user', resource: 'user' }))).toBe(
      'No such user'
    );
  });

  it('returns the fallback for a value that is not an Error', () => {
    expect(errorMessage('boom', 'Unknown error')).toBe('Unknown error');
    expect(errorMessage(undefined, 'Unknown error')).toBe('Unknown error');
  });

  it('describes a value that is not an Error as text when there is no fallback', () => {
    expect(errorMessage('boom')).toBe('boom');
    expect(errorMessage(42)).toBe('42');
    expect(errorMessage(null)).toBe('null');
  });
});
