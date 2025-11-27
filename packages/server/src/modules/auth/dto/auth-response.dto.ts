import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '@prisma/client';

@ObjectType()
export class AuthResponse {
  @Field(() => UserResponse)
  user!: User;

  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;
}

@ObjectType()
export class UserResponse {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field({ nullable: true })
  ico?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  role!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  emailVerifiedAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
