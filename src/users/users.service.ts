import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PasswordService } from '../auth/password.service';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  list() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateUserDto, actor?: AuthUser) {
    await this.ensureEmailAvailable(dto.email);

    const passwordHash = await this.passwordService.hash(dto.password);

    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        role: dto.role,
        isActive: dto.isActive ?? true,
        passwordHash,
        createdByUserId: actor?.id,
      },
      select: safeUserSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.findExisting(id);

    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      await this.ensureEmailAvailable(dto.email);
    }

    await this.ensureActiveAdminRemains(existing, dto);

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email?.toLowerCase(),
        name: dto.name,
        role: dto.role,
        isActive: dto.isActive,
      },
      select: safeUserSelect,
    });
  }

  async updatePassword(id: string, dto: UpdateUserPasswordDto) {
    await this.findExisting(id);
    const passwordHash = await this.passwordService.hash(dto.password);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: safeUserSelect,
    });
  }

  toAuthUser(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private async findExisting(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} was not found.`);
    }

    return user;
  }

  private async ensureEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A user with that email already exists.');
    }
  }

  private async ensureActiveAdminRemains(
    existing: { role: UserRole; isActive: boolean },
    dto: UpdateUserDto,
  ) {
    if (existing.role !== UserRole.ADMIN || !existing.isActive) {
      return;
    }

    const wouldRemoveAdminRole =
      dto.role !== undefined && dto.role !== UserRole.ADMIN;
    const wouldDeactivate = dto.isActive === false;

    if (!wouldRemoveAdminRole && !wouldDeactivate) {
      return;
    }

    const adminCount = await this.prisma.user.count({
      where: { role: UserRole.ADMIN, isActive: true },
    });

    if (adminCount <= 1) {
      throw new BadRequestException('At least one active admin is required.');
    }
  }
}
