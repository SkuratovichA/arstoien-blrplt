import { registerEnumType } from '@nestjs/graphql';
import { UserStatus, UserRole, AuthProvider } from '@prisma/client';

// Re-export Prisma enums
export { UserStatus, UserRole, AuthProvider };

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
