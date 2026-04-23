import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { env } from '../config/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

type RequestWithCookies = Omit<Request, 'cookies'> & {
  cookies?: Record<string, unknown>;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setAuthCookies(res, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.refresh(
      this.getCookie(req, REFRESH_TOKEN_COOKIE),
    );
    this.setAuthCookies(res, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(this.getCookie(req, REFRESH_TOKEN_COOKIE));
    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const baseCookie = {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...baseCookie,
      maxAge: env.ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...baseCookie,
      maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  private getCookie(req: RequestWithCookies, name: string): string | undefined {
    const value = req.cookies?.[name];
    return typeof value === 'string' ? value : undefined;
  }
}
