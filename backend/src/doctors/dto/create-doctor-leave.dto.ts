import { IsDateString, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDoctorLeaveDto {
  @IsDateString()
  leave_date: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  reason?: string;
}
