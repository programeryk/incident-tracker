import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TrimString } from '../../common/transforms/trim-string.transform';

export class CreateIncidentCommentDto {
  @ApiProperty({
    example: 'Replacement seal ordered and maintenance team notified.',
  })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ example: 'shift-supervisor' })
  @IsOptional()
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  author?: string;
}
