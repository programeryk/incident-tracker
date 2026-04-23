import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';

@Injectable()
export class InitialAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async onApplicationBootstrap() {
    if (!env.INITIAL_ADMIN_EMAIL || !env.INITIAL_ADMIN_PASSWORD) {
      return;
    }

    const email = env.INITIAL_ADMIN_EMAIL.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return;
    }

    await this.prisma.user.create({
      data: {
        email,
        name: 'Initial Admin',
        role: UserRole.ADMIN,
        passwordHash: await this.passwordService.hash(
          env.INITIAL_ADMIN_PASSWORD,
        ),
      },
    });

    this.logger.log(`Created initial admin account for ${email}.`);
  }
}
