import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TrimString } from '../../common/transforms/trim-string.transform';

export class CreateUserDto {
  @ApiProperty({ example: 'tech@example.com' })
  @TrimString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Maintenance Tech' })
  @TrimString()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TECHNICIAN })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ example: 'change-me-before-production' })
  @IsString()
  @MinLength(12)
  password!: string;

  @ApiProperty({ example: true, default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
