import { describe, expect, it } from 'vitest';
import { passwordChangeSchema } from './password-form-schema';

describe('passwordChangeSchema', () => {
  const valid = {
    currentPassword: 'current-password',
    newPassword: 'brand-new-password',
    confirmPassword: 'brand-new-password',
  };

  it('accepts matching passwords of sufficient length', () => {
    expect(passwordChangeSchema.safeParse(valid).success).toBe(true);
  });

  it('attaches the mismatch to the confirmation field', () => {
    const result = passwordChangeSchema.safeParse({
      ...valid,
      confirmPassword: 'different-password',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ message: 'Passwords do not match', path: ['confirmPassword'] }),
    ]);
  });
});
