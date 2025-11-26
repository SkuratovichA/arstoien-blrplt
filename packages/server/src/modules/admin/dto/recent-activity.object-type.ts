import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class RecentActivityType {
  @Field()
  id!: string;

  @Field()
  action!: string;

  @Field()
  description!: string;

  @Field()
  createdAt!: Date;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  userEmail?: string;
}
