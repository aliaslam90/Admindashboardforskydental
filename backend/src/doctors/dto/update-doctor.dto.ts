import {
  IsString,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDoctorLeaveDto } from './create-doctor-leave.dto';

export class UpdateDoctorDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  specialization?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services_offered?: string[];

  @IsObject()
  @IsOptional()
  working_hours?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDoctorLeaveDto)
  @IsOptional()
  leave_dates?: CreateDoctorLeaveDto[];
}
