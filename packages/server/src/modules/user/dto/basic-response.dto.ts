import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BasicResponse {
  @Field()
  success!: boolean;

  @Field()
  message!: string;
}
