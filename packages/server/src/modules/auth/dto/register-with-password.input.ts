import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

@InputType()
export class RegisterWithPasswordInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @Field()
  @IsString()
  @Length(1, 100, { message: 'First name is required' })
  firstName!: string;

  @Field()
  @IsString()
  @Length(1, 100, { message: 'Last name is required' })
  lastName!: string;
}
