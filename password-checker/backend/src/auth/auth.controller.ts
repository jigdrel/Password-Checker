import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Disable2FADto } from './dto/disable-2fa.dto';
import { Confirm2FADto } from './dto/confirm-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials / 2FA required' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start 2FA setup (returns QR + secret)' })
  @ApiResponse({ status: 200, description: 'Returns QR and secret, saves secret to DB but not enabled yet' })
  async enable2FA(@CurrentUser() user: any, @Body() enable2FADto: Enable2FADto) {
    return this.authService.enable2FA(user.id, enable2FADto);
  }

  // ✅ NEW: confirm setup by checking a real code, then persist enabled=true
  @Post('2fa/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm 2FA setup (verifies code, enables 2FA)' })
  @ApiResponse({ status: 200, description: '2FA enabled and persisted' })
  @ApiResponse({ status: 401, description: 'Invalid code' })
  async confirm2FA(@CurrentUser() user: any, @Body() confirm2FADto: Confirm2FADto) {
    return this.authService.confirm2FA(user.id, confirm2FADto.code);
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA code (used during login if enabled)' })
  @ApiResponse({ status: 200, description: '2FA verified, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async verify2FA(@Body() verify2FADto: Verify2FADto) {
    return this.authService.verify2FA(verify2FADto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA for user' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  async disable2FA(@CurrentUser() user: any, @Body() disable2FADto: Disable2FADto) {
    return this.authService.disable2FA(user.id, disable2FADto);
  }
}
