import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { TrimString } from '../../common/transforms/trim-string.transform';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @TrimString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'change-me-before-production' })
  @IsString()
  @MinLength(8)
  password!: string;
}
