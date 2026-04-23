import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TrimString } from '../../common/transforms/trim-string.transform';

export class CreateMachineDto {
  @ApiProperty({ example: 'PRESS-04' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string;

  @ApiProperty({ example: 'Hydraulic Press 04' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Press Hall' })
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  area!: string;

  @ApiPropertyOptional({ example: 'Line 3' })
  @IsOptional()
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  line?: string;

  @ApiPropertyOptional({ example: 'Main production press.' })
  @IsOptional()
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
