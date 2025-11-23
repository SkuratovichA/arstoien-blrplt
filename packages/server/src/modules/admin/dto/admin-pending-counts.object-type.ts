import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AdminPendingCountsType {
  @Field(() => Int, { description: 'Number of users pending approval' })
  pendingUsers!: number;

  @Field(() => Int, { description: 'Number of listings pending approval' })
  pendingListings!: number;
}
