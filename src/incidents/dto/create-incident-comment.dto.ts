import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIncidentCommentDto {
  @ApiProperty({
    example: 'Replacement seal ordered and maintenance team notified.',
  })
  @IsString()
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ example: 'shift-supervisor' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  author?: string;
}
