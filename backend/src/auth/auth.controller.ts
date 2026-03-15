import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString } from 'class-validator';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

// Rate limiter in-memory: max 10 tentativi per IP ogni 60 secondi
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return;
  }

  if (entry.count >= 10) {
    throw new HttpException(
      'Troppi tentativi di accesso. Riprova tra un minuto.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  entry.count++;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    checkLoginRateLimit(ip);
    return this.authService.login(dto.username, dto.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }
}
