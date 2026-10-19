import { Field, ID, ObjectType } from '@nestjs/graphql';
import { NotificationStatus, NotificationType } from '../../../common/graphql/enums';
import { User } from '../../user/dto/user.object-type';

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
