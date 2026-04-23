import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (
      !user?.isActive ||
      !(await this.passwordService.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const authUser = this.usersService.toAuthUser(user);
    const accessToken = await this.tokenService.signAccessToken(authUser);
    const refreshToken = this.tokenService.createRefreshToken();

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: this.tokenService.hashRefreshToken(refreshToken),
        expiresAt: this.tokenService.getRefreshExpiresAt(),
      },
    });

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const session = await this.prisma.refreshSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session?.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const newRefreshToken = this.tokenService.createRefreshToken();
    const authUser = this.usersService.toAuthUser(session.user);

    await this.prisma.$transaction([
      this.prisma.refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: this.tokenService.hashRefreshToken(newRefreshToken),
          expiresAt: this.tokenService.getRefreshExpiresAt(),
        },
      }),
    ]);

    return {
      user: authUser,
      accessToken: await this.tokenService.signAccessToken(authUser),
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash: this.tokenService.hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}
