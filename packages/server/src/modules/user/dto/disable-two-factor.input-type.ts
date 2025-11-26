import { InputType, Field } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class DisableTwoFactorInputType {
  @Field()
  @IsString()
  password!: string;
}
