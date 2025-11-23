import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SystemSettingsObjectType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  supportEmail!: string;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => Date)
  createdAt!: Date;
}
