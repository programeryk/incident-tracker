import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TrimString } from '../../common/transforms/trim-string.transform';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'tech@example.com' })
  @IsOptional()
  @TrimString()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Maintenance Tech' })
  @IsOptional()
  @TrimString()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.SUPERVISOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
