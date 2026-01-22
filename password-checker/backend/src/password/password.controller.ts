import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PasswordService } from './password.service';
import { CheckPasswordDto } from './dto/check-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('password')
@Controller('password')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('check')
  @ApiOperation({ summary: 'Check password strength' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns password strength analysis',
    schema: {
      example: {
        score: 3,
        feedback: ['Good password strength'],
        isCommon: false,
        crackTime: '5 years'
      }
    }
  })
  async checkPassword(@Body() checkPasswordDto: CheckPasswordDto): Promise<any> {
  return this.passwordService.checkPassword(checkPasswordDto.password);
}

  @Post('check-pwned')
  @ApiOperation({ summary: 'Check if password has been pwned (HaveIBeenPwned)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns pwned status',
    schema: {
      example: {
        isPwned: true,
        count: 12345
      }
    }
  })
  async checkPwnedPassword(@Body() checkPasswordDto: CheckPasswordDto) {
    return this.passwordService.checkPwnedPassword(checkPasswordDto.password);
  }
}