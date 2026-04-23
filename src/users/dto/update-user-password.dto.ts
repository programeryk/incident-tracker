import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {
  @ApiProperty({ example: 'new-password-for-user' })
  @IsString()
  @MinLength(12)
  password!: string;
}
