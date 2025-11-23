import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class AdminStatsType {
  @Field(() => Int)
  pendingUsers!: number;

  @Field(() => Int)
  pendingListings!: number;

  @Field(() => Int)
  activeAuctions!: number;

  @Field(() => Int)
  todayRegistrations!: number;

  @Field(() => Int)
  todayTransactions!: number;

  @Field(() => Float)
  todayRevenue!: number;

  @Field(() => Int)
  totalUsers!: number;

  @Field(() => Int)
  totalListings!: number;
}
