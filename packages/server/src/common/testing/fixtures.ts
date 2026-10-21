import { AuthProvider, type User, UserRole, UserStatus } from '../../generated/prisma/client.js';

export const fixtureDate = new Date('2026-01-01T00:00:00.000Z');

/**
 * An active user with every column set; a test overrides the columns it cares about
 */
export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: null,
    googleId: null,
    authProvider: AuthProvider.EMAIL,
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    status: UserStatus.ACTIVE,
    role: UserRole.USER,
    avatar: null,
    bio: null,
    preferredLocale: 'cs',
    otpAuthEnabled: false,
    lastLoginAt: null,
    emailVerifiedAt: fixtureDate,
    approvedAt: null,
    approvedById: null,
    rejectionReason: null,
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    deletedAt: null,
    ...overrides,
  };
}
