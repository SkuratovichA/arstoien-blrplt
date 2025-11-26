import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TwoFactorResponse {
  @Field()
  secret!: string;

  @Field()
  qrCode!: string;

  @Field(() => [String])
  backupCodes!: string[];
}
