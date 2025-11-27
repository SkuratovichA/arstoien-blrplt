import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, IsBoolean, IsOptional } from 'class-validator';

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
