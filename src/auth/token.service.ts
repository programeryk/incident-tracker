import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env';
import { AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(user: AuthUser) {
    const payload: JwtPayload = {
      ...user,
      sub: user.id,
    };

    return this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: env.JWT_ACCESS_SECRET,
    });
  }

  createRefreshToken() {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  getRefreshExpiresAt() {
    return new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
  }
}
