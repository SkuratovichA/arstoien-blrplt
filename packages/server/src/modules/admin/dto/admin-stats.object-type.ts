import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AdminStatsType {
  @Field(() => Int)
  pendingUsers!: number;

  @Field(() => Int)
  todayRegistrations!: number;

  @Field(() => Int)
  totalUsers!: number;
}
