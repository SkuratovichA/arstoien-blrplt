import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  Length,
} from 'class-validator';

@InputType()
export class RegisterInputType {
  @Field()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password!: string;

  @Field()
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @Field()
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(8, 8, { message: 'IČO must be exactly 8 characters' })
  @Matches(/^\d{8}$/, { message: 'IČO must contain only digits' })
  ico?: string;
}
