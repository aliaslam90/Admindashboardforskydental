import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @MaxLength(255)
  password: string;

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

  @IsEnum(UserRole, {
    message: 'role must be one of: patient, receptionist, manager, admin, content_editor',
  })
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  email_verified?: boolean;
}

