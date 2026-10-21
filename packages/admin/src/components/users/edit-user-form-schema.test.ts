import { describe, expect, it } from 'vitest';
import { USER_STATUSES } from '@/lib/user-status';
import { editUserSchema } from './edit-user-form-schema';

const valid = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  role: 'USER',
  status: 'ACTIVE',
};

describe('editUserSchema', () => {
  it.each(USER_STATUSES)('accepts the status %s of the server enum', (status) => {
    expect(editUserSchema.safeParse({ ...valid, status }).success).toBe(true);
  });

  it.each(['PENDING', 'BANNED'])('rejects %s, which the server enum does not have', (status) => {
    expect(editUserSchema.safeParse({ ...valid, status }).success).toBe(false);
  });
});
