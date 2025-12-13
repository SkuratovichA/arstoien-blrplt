import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, Length, IsOptional } from 'class-validator';

@InputType()
export class RegisterCustomerInput {
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
  @Length(1, 20, { message: 'Phone must be between 1 and 20 characters' })
  phone!: string;
}