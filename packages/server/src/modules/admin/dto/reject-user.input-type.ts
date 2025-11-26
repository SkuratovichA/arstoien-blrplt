import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class RejectUserInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
