import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEmail, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  firstName!: string;

  @Field()
  @IsString()
  lastName!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field(() => String, { nullable: true, defaultValue: 'USER' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;
}
