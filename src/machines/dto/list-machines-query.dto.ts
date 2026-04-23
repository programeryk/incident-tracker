import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TrimString } from '../../common/transforms/trim-string.transform';
import { BooleanQuery } from '../../common/transforms/boolean-query.transform';

export class ListMachinesQueryDto {
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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @BooleanQuery()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 50, default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;
}
