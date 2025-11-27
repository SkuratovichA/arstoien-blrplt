import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

@InputType()
export class UpdateUserInput {
  @Field()
  @IsString()
  userId!: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  firstName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  lastName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @Field({ nullable: true })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  otpAuthEnabled?: boolean;
}
