import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, IsPhoneNumber, IsUrl, IsEnum } from 'class-validator';
import { Currency } from '@/common/graphql/enums';

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

  @Field(() => Currency, { nullable: true })
  @IsOptional()
  @IsEnum(Currency)
  preferredCurrency?: Currency;
}
