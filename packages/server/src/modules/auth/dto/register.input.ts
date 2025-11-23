import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, Length, Matches, IsOptional } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @Length(1, 100, { message: 'First name is required' })
  firstName!: string;

  @Field()
  @IsString()
  @Length(1, 100, { message: 'Last name is required' })
  lastName!: string;

  @Field()
  @IsString()
  @Length(1, 20, { message: 'Phone is required' })
  phone!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  companyPhone?: string;

  @Field({ nullable: true, description: '8-digit Czech company ID (recommended for CZ companies)' })
  @IsOptional()
  @IsString()
  @Length(8, 8, { message: 'ICO must be exactly 8 digits' })
  @Matches(/^\d{8}$/, { message: 'ICO must contain only digits' })
  ico?: string;
}
