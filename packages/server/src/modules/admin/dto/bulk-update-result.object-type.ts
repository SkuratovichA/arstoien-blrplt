import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BulkUpdateResultType {
  @Field(() => Int)
  updated!: number;

  @Field(() => Boolean)
  success!: boolean;

  @Field({ nullable: true })
  message?: string;
}