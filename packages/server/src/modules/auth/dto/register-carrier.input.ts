import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, Length, IsIn } from 'class-validator';

@InputType()
export class RegisterCarrierInput {
  @Field()
  @IsString()
  @Length(1, 255, { message: 'Company name is required' })
  companyName!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @Length(1, 200, { message: 'Contact person is required' })
  contactPerson!: string;

  @Field()
  @IsString()
  @Length(1, 50, { message: 'Identification number is required' })
  identificationNumber!: string;

  @Field()
  @IsString()
  @IsIn(['ICO', 'NIP', 'OTHER'], { message: 'Invalid identification number type' })
  identificationNumberType!: string;

  @Field()
  @IsString()
  @IsIn(['Czechia', 'Slovakia', 'Poland'], { message: 'Operating region must be Czechia, Slovakia, or Poland' })
  operatingRegion!: string;
}