import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { ListMachinesQueryDto } from './dto/list-machines-query.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

const machineInclude = {
  _count: {
    select: {
      incidents: true,
    },
  },
} satisfies Prisma.MachineInclude;

@Injectable()
export class MachinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListMachinesQueryDto) {
    const where: Prisma.MachineWhereInput = {
      area: query.area,
      line: query.line,
      isActive: query.isActive,
    };
    const skip = (query.page - 1) * query.pageSize;

    const [itemCount, data] = await this.prisma.$transaction([
      this.prisma.machine.count({ where }),
      this.prisma.machine.findMany({
        where,
        skip,
        take: query.pageSize,
        include: machineInclude,
        orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
      }),
    ]);

    const pageCount = Math.ceil(itemCount / query.pageSize);

    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        itemCount,
        pageCount,
        hasNextPage: query.page < pageCount,
        hasPreviousPage: query.page > 1 && pageCount > 0,
      },
    };
  }

  async getOne(idOrCode: string) {
    const machine = await this.prisma.machine.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
      include: machineInclude,
    });

    if (!machine) {
      throw new NotFoundException(`Machine ${idOrCode} was not found.`);
    }

    return machine;
  }

  async create(dto: CreateMachineDto, actor: AuthUser) {
    const code = dto.code.toUpperCase();
    const existing = await this.prisma.machine.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A machine with that code already exists.');
    }

    return this.prisma.machine.create({
      data: {
        code,
        name: dto.name,
        area: dto.area,
        line: dto.line,
        description: dto.description,
        isActive: dto.isActive ?? true,
        createdByUserId: actor.id,
        updatedByUserId: actor.id,
      },
      include: machineInclude,
    });
  }

  async update(idOrCode: string, dto: UpdateMachineDto, actor: AuthUser) {
    const machine = await this.getOne(idOrCode);

    return this.prisma.machine.update({
      where: { id: machine.id },
      data: {
        name: dto.name,
        area: dto.area,
        line: dto.line,
        description: dto.description,
        isActive: dto.isActive,
        updatedByUserId: actor.id,
      },
      include: machineInclude,
    });
  }

  async ensureMachineForIncident(machineCode: string, actor?: AuthUser) {
    const code = machineCode.trim().toUpperCase();
    const existing = await this.prisma.machine.findUnique({
      where: { code },
      select: { code: true },
    });

    if (existing) {
      return existing.code;
    }

    const machine = await this.prisma.machine.create({
      data: {
        code,
        name: code,
        area: 'Unassigned',
        createdByUserId: actor?.id,
        updatedByUserId: actor?.id,
      },
      select: { code: true },
    });

    return machine.code;
  }
}
