import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserStatus, UserRole, AuthProvider } from '@/common/graphql/enums';

@ObjectType()
export class UserObjectType {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field(() => AuthProvider)
  authProvider!: AuthProvider;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => UserStatus)
  status!: UserStatus;

  @Field(() => UserRole)
  role!: UserRole;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field({ nullable: true })
  emailVerifiedAt?: Date;

  @Field({ nullable: true })
  approvedAt?: Date;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field({ nullable: true })
  aresError?: string;

  @Field({ nullable: true })
  aresCheckedAt?: Date;

  @Field({ nullable: true })
  documentsRequestedAt?: Date;

  @Field(() => String, { nullable: true })
  preferredLocale?: string | null;

  @Field(() => String, { nullable: true })
  preferredCurrency?: string | null;

  @Field(() => Boolean)
  otpAuthEnabled!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

// Alias for compatibility with imports expecting 'User'
export { UserObjectType as User };
