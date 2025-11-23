import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class RequestDocumentsResponseType {
  @Field()
  success!: boolean;

  @Field()
  message!: string;
}
