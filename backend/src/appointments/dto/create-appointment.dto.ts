import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  IsInt,
  MaxLength,
} from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  patient_id: string;

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
  @MaxLength(255)
  calendar_event_id?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

