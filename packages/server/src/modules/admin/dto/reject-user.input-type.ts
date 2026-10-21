import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

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
