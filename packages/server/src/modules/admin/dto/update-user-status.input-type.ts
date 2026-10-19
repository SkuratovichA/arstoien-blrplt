import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsString } from 'class-validator';
import { UserStatus } from '../../../common/graphql/enums/index.js';

@InputType()
export class UpdateUserStatusInput {
  @Field(() => ID)
  @IsString()
  userId!: string;

  @Field(() => UserStatus)
  @IsEnum(UserStatus)
  status!: UserStatus;
}
