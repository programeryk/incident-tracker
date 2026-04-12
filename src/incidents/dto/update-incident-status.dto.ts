import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { IncidentStatus } from '../incidents.types';

export class UpdateIncidentStatusDto {
  @ApiProperty({ enum: IncidentStatus, example: IncidentStatus.IN_PROGRESS })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;
}
