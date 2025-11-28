import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsArray, IsString } from 'class-validator';

@InputType()
export class BulkUpdateOtpInput {
  @Field(() => Boolean)
  @IsBoolean()
  enabled!: boolean;

  @Field(() => [String], { nullable: true, description: 'Specific user IDs to update. If not provided, updates all users.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}