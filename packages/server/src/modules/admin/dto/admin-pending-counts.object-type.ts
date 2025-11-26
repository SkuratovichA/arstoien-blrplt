import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AdminPendingCountsType {
  @Field(() => Int, { description: 'Number of users pending approval' })
  pendingUsers!: number;
}
