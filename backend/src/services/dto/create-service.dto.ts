import { IsString, IsInt, IsBoolean, IsNotEmpty, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  category: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsInt()
  @Min(1)
  @Max(1440) // Maximum 24 hours in minutes
  duration_minutes: number;

  @IsBoolean()
  active_status?: boolean;
}
