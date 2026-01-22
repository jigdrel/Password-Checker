import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckPasswordDto {
  @ApiProperty({ example: 'MySecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}