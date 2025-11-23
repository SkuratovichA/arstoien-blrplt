import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../user/dto/user.object-type';
import { NotificationType, NotificationStatus } from '@/common/graphql/enums';

@ObjectType()
export class Notification {
  @Field(() => ID)
  id!: string;

  @Field(() => NotificationType)
  type!: NotificationType;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  message!: string;

  // data field exists in database but not exposed via GraphQL
  // Contains raw notification data for internal use only
  data?: Record<string, unknown>;

  @Field(() => NotificationStatus)
  status!: NotificationStatus;

  @Field(() => Date, { nullable: true })
  readAt?: Date;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  // Relations
  @Field(() => String)
  userId!: string;

  @Field(() => User, { nullable: true })
  user?: User;
}
