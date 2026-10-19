import { registerEnumType } from '@nestjs/graphql';
import { AuthProvider, UserRole, UserStatus } from '../../../generated/prisma/client.js';

// Re-export Prisma enums
export { AuthProvider, UserRole, UserStatus };

// Register enums for GraphQL
registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'The status of a user account',
});

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of a user in the system',
});

registerEnumType(AuthProvider, {
  name: 'AuthProvider',
  description: 'Authentication provider used by the user',
});
