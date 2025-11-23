import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsEmail, IsOptional, MaxLength, ValidateIf } from 'class-validator';

@InputType()
export class UpdatePendingUserInput {
  @Field(() => ID)
  @IsUUID()
  userId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.companyEmail !== '')
  @IsEmail()
  companyEmail?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyWebsite?: string;
}
