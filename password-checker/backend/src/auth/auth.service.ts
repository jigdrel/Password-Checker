import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Disable2FADto } from './dto/disable-2fa.dto';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async login(loginDto: LoginDto) {
  const { email, password } = loginDto;

  // 1️⃣ Find user
  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 2️⃣ Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }
  
  if (user.twoFactorEnabled) {
    return {
      requiresTwoFactor: true, // frontend uses this flag
      userId: user.id,         // frontend needs this for /auth/2fa/verify
      message: '2FA code required',
    };
  }

  // 4️⃣ Only issue JWT if 2FA is NOT enabled
  const token = this.generateToken(user);

  return {
    requiresTwoFactor: false,
    access_token: token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  };
}


  // ✅ Start 2FA setup: generate + store secret, but keep disabled until verified
  async enable2FA(userId: string, enable2FADto: Enable2FADto) {
    const { password } = enable2FADto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = authenticator.generateSecret();
    const appName =
      this.configService.get<string>('APP_NAME') || 'Password Checker';
    const otpauth = authenticator.keyuri(user.email, appName, secret);

    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    // ✅ Persist secret and ensure enabled=false until verified
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false,
      },
    });

    return {
      secret,
      qrCode: qrCodeUrl,
      message:
        'Scan this QR code with your authenticator app, then verify with a code',
    };
  }

  // ✅ Verify code and (if not enabled yet) enable 2FA, then issue JWT
  async verify2FA(verify2FADto: Verify2FADto) {
    const { userId, code } = verify2FADto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA is not set up for this user');
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const updatedUser = user.twoFactorEnabled
      ? user
      : await this.prisma.user.update({
          where: { id: userId },
          data: { twoFactorEnabled: true },
        });

    const token = this.generateToken(updatedUser);

    return {
      access_token: token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        twoFactorEnabled: true,
      },
    };
  }

  async disable2FA(userId: string, disable2FADto: Disable2FADto) {
    const { password, code } = disable2FADto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA secret missing for this user');
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return {
      message: '2FA has been disabled successfully',
    };
  }
  async confirm2FA(userId: string, code: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    throw new UnauthorizedException('2FA setup not started');
  }

  const isValid = authenticator.check(code, user.twoFactorSecret);
  if (!isValid) {
    throw new UnauthorizedException('Invalid 2FA code');
  }

  const updated = await this.prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
    select: {
      id: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
    },
  });

  return updated;
}


  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
