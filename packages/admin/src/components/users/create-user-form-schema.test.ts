import { describe, expect, it } from 'vitest';
import { createUserSchema } from './create-user-form-schema';

const valid = { email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' };

const messagesFor = (input: Record<string, unknown>) => {
  const result = createUserSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('createUserSchema', () => {
  it('accepts the three required fields and defaults the role to USER', () => {
    const result = createUserSchema.safeParse(valid);

    expect(result.success).toBe(true);
    expect(result.data?.role).toBe('USER');
  });

  it('accepts empty strings for the optional phone and password', () => {
    expect(createUserSchema.safeParse({ ...valid, phone: '', password: '' }).success).toBe(true);
  });

  it('requires an email, a first name and a last name', () => {
    expect(messagesFor({ email: '', firstName: '', lastName: '' })).toEqual(
      expect.arrayContaining([
        'Email is required',
        'First name is required',
        'Last name is required',
      ])
    );
  });

  it('rejects a malformed email address', () => {
    expect(messagesFor({ ...valid, email: 'not-an-email' })).toEqual([
      'Please enter a valid email address',
    ]);
  });

  it('rejects a password shorter than 8 characters but not an empty one', () => {
    expect(messagesFor({ ...valid, password: 'short' })).toEqual([
      'Password must be at least 8 characters',
    ]);
    expect(messagesFor({ ...valid, password: '' })).toEqual([]);
  });

  it('rejects a role other than USER or ADMIN', () => {
    expect(messagesFor({ ...valid, role: 'ROOT' })).toEqual(['Role must be either USER or ADMIN']);
  });

  it('limits the length of the names and the phone number', () => {
    expect(messagesFor({ ...valid, firstName: 'a'.repeat(101) })).toEqual([
      'First name must be at most 100 characters',
    ]);
    expect(messagesFor({ ...valid, phone: '1'.repeat(21) })).toEqual([
      'Phone must be at most 20 characters',
    ]);
  });
});
