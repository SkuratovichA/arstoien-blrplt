import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

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
