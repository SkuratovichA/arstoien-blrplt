import { InputType, Field, ID } from '@nestjs/graphql';
import { IsEnum, IsString } from 'class-validator';
import { UserStatus } from '@/common/graphql/enums';

@InputType()
export class UpdateUserStatusInput {
  @Field(() => ID)
  @IsString()
  userId!: string;

  @Field(() => UserStatus)
  @IsEnum(UserStatus)
  status!: UserStatus;
}
