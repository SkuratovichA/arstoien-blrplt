import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@InputType()
export class ApproveUserInput {
  @Field(() => ID)
  @IsString()
  userId!: string;

  @Field()
  @IsBoolean()
  approved!: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
