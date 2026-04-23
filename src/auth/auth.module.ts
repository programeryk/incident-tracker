import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { InitialAdminService } from './initial-admin.service';
import { PasswordService } from './password.service';
import { RolesGuard } from './roles.guard';
import { TokenService } from './token.service';

@Module({
  imports: [JwtModule.register({}), PrismaModule, UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    InitialAdminService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [TokenService, PasswordService],
})
export class AuthModule {}
