import { IsDateString, IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateDoctorLeaveDto {
  @IsDateString()
  @IsOptional()
  leave_date?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  reason?: string;
}

