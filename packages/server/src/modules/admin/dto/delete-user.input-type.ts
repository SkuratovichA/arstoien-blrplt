import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class DeleteUserInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  hardDelete?: boolean;
}
