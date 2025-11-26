import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class UserGrowthDataPoint {
  @Field(() => String)
  period!: string; // Date or month label (e.g., "2024-01", "Jan 2024")

  @Field(() => Int)
  totalUsers!: number; // Cumulative total users up to this period

  @Field(() => Int)
  activeUsers!: number; // Active users in this period

  @Field(() => Int)
  newUsers!: number; // New users added in this period

  @Field(() => Int)
  pendingUsers!: number; // Pending users in this period
}

@ObjectType()
export class UserGrowthStatsType {
  @Field(() => [UserGrowthDataPoint])
  data!: UserGrowthDataPoint[];

  @Field()
  startDate!: Date;

  @Field()
  endDate!: Date;
}
