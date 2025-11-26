import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class DeleteAccountInputType {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  password?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  confirmText?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;
}
