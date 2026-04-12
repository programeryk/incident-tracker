import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TrimString } from '../../common/transforms/trim-string.transform';
import { IncidentPriority, IncidentStatus } from '../incidents.types';

export class CreateIncidentDto {
  @ApiProperty({ example: 'Hydraulic pressure drop on line 3' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({
    example: 'Pressure dropped below threshold and triggered emergency stop.',
  })
  @IsOptional()
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'MACHINE-003' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  machineId!: string;

  @ApiProperty({ enum: IncidentPriority, example: IncidentPriority.HIGH })
  @IsEnum(IncidentPriority)
  priority!: IncidentPriority;

  @ApiPropertyOptional({ enum: IncidentStatus, example: IncidentStatus.OPEN })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ example: '2026-04-11T14:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ example: '2026-04-11T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  acknowledgedAt?: string;

  @ApiPropertyOptional({ example: '2026-04-11T16:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  resolvedAt?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  downtimeMinutes?: number;
}
