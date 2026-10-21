import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateSystemSettingsInputType {
  @Field(() => String, { nullable: true })
  @IsEmail()
  @IsString()
  @IsOptional()
  supportEmail?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  otpAuthEnabled?: boolean;
}
