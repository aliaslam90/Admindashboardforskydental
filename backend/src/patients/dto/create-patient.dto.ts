import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
    message: 'phone_number must be a valid phone number',
  })
  @MaxLength(20)
  phone_number: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsOptional()
  @Length(4, 4, { message: 'emirates_id_last4 must be exactly 4 characters' })
  @Matches(/^[0-9]{4}$/, {
    message: 'emirates_id_last4 must contain only 4 digits',
  })
  emirates_id_last4?: string;
}

