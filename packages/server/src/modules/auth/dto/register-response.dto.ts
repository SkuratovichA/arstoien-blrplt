import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RegisterResponse {
  @Field()
  success!: boolean;

  @Field()
  message!: string;
}
