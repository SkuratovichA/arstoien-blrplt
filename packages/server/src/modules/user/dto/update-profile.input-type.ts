import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, IsPhoneNumber, IsUrl, IsBoolean } from 'class-validator';

@InputType()
export class UpdateProfileInputType {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber('CZ')
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  preferredLocale?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  preferredCurrency?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  otpAuthEnabled?: boolean;
}
