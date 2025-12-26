import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsEmail,
  IsInt,
  MaxLength,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../entities/appointment.entity';

export class PatientInfoDto {
  @IsUUID()
  @IsOptional()
  id?: string; // If provided, use existing patient

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CreateAppointmentWithPatientDto {
  @ValidateNested()
  @Type(() => PatientInfoDto)
  @IsNotEmpty()
  patient: PatientInfoDto;

  @IsInt()
  @IsNotEmpty()
  doctor_id: number;

  @IsInt()
  @IsNotEmpty()
  service_id: number;

  @IsDateString()
  @IsNotEmpty()
  start_datetime: string;

  @IsDateString()
  @IsNotEmpty()
  end_datetime: string;

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

