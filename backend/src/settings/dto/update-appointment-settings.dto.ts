import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateAppointmentSettingsDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(240)
  buffer_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(168)
  cancellation_window_hours?: number;

  @IsBoolean()
  @IsOptional()
  otp_required?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(60)
  otp_expiry_minutes?: number;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  opening_time?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  closing_time?: string;

  @IsOptional()
  working_days?: string[];

  @IsBoolean()
  @IsOptional()
  calendar_connected?: boolean;
}

