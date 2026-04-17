import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TrimString } from '../../common/transforms/trim-string.transform';
import { IncidentPriority, IncidentStatus } from '../incidents.types';

export class ListIncidentsQueryDto {
  @ApiPropertyOptional({ example: 'MACHINE-003' })
  @IsOptional()
  @TrimString()
  @IsString()
  @MaxLength(80)
  machineId?: string;

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
}
