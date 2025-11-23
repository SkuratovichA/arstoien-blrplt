import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class AuditLogObjectType {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { nullable: true })
  userId?: string;

  @Field(() => String)
  action!: string;

  @Field(() => String)
  entityType!: string;

  @Field(() => String, { nullable: true })
  entityId?: string;

  @Field(() => String, { nullable: true })
  ipAddress?: string;

  @Field(() => String, { nullable: true })
  userAgent?: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
