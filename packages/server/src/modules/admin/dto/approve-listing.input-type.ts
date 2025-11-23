import { InputType, Field, ID } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@InputType()
export class ApproveListingInput {
  @Field(() => ID)
  @IsString()
  listingId!: string;

  @Field()
  @IsBoolean()
  approved!: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
