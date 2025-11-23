import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';

@InputType()
export class UpdateSystemSettingsInputType {
  @Field(() => String)
  @IsEmail()
  @IsString()
  supportEmail!: string;
}
