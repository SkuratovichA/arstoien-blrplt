import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { NotificationStatus, NotificationType } from '../../../common/graphql/enums/index.js';

@InputType()
export class NotificationFiltersInputType {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
