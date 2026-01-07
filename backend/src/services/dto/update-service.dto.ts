import { IsString, IsInt, IsBoolean, Min, Max, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  category?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1440)
  duration_minutes?: number;

  @IsBoolean()
  @IsOptional()
  active_status?: boolean;
}
