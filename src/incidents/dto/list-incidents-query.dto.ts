import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BooleanQuery } from '../../common/transforms/boolean-query.transform';
import { TrimString } from '../../common/transforms/trim-string.transform';
import { IncidentPriority, IncidentStatus } from '../incidents.types';

export class ListIncidentsQueryDto {
  @ApiPropertyOptional({ example: 'MACHINE-003' })
  @IsOptional()
  @TrimString()
  @IsString()
  @MaxLength(80)
  machineId?: string;

  @ApiPropertyOptional({ example: 'Press Hall' })
  @IsOptional()
  @TrimString()
  @IsString()
  @MaxLength(80)
  area?: string;

  @ApiPropertyOptional({ example: 'Line 3' })
  @IsOptional()
  @TrimString()
  @IsString()
  @MaxLength(80)
  line?: string;

  @ApiPropertyOptional({ example: 'clxassigneduser001' })
  @IsOptional()
  @TrimString()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional({ example: 'clxcreatoruser001' })
  @IsOptional()
  @TrimString()
  @IsString()
  createdByUserId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @BooleanQuery()
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ enum: IncidentStatus, example: IncidentStatus.OPEN })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({
    enum: IncidentPriority,
    example: IncidentPriority.CRITICAL,
  })
  @IsOptional()
  @IsEnum(IncidentPriority)
  priority?: IncidentPriority;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
