import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { IncidentStatus, IncidentPriority } from '../incidents.types';

export class UpdateIncidentStatusDto {
  @ApiProperty({ enum: IncidentStatus, example: IncidentStatus.IN_PROGRESS })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;

  @ApiPropertyOptional({ example: '2026-04-11T16:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  resolvedAt?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  downtimeMinutes?: number;

  @ApiPropertyOptional({
    enum: IncidentPriority,
    example: IncidentPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(IncidentPriority)
  priority?: IncidentPriority;
}
