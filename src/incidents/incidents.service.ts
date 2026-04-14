import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IncidentStatus as PrismaIncidentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIncidentDto) {
    const status = dto.status ?? PrismaIncidentStatus.OPEN;
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const lifecycle = this.buildLifecycleForCreate({
      occurredAt,
      status,
    });

    return await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,
        machineId: dto.machineId,
        priority: dto.priority,
        status,
        occurredAt: dto.occurredAt ? occurredAt : undefined,
        acknowledgedAt: lifecycle.acknowledgedAt,
        resolvedAt: lifecycle.resolvedAt,
        downtimeMinutes: lifecycle.downtimeMinutes,
      },
      include: {
        comments: true,
      },
    });
  }

  async getAll(query: ListIncidentsQueryDto) {
    const where: Prisma.IncidentWhereInput = {
      machineId: query.machineId,
      status: query.status,
      priority: query.priority,
      occurredAt:
        query.fromDate || query.toDate
          ? {
              gte: query.fromDate ? new Date(query.fromDate) : undefined,
              lte: query.toDate ? new Date(query.toDate) : undefined,
            }
          : undefined,
    };

    return await this.prisma.incident.findMany({
      where,
      include: {
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
    });
  }

  async getOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${id} was not found.`);
    }

    return incident;
  }

  async updateStatus(id: string, dto: UpdateIncidentStatusDto) {
    const incident = await this.getOne(id);
    const lifecycle = this.buildLifecycleForTransition(incident, dto.status);

    return this.prisma.incident.update({
      where: { id },
      data: {
        status: dto.status,
        acknowledgedAt: lifecycle.acknowledgedAt,
        resolvedAt: lifecycle.resolvedAt,
        downtimeMinutes: lifecycle.downtimeMinutes,
      },
      include: {
        comments: true,
      },
    });
  }

  async addComment(id: string, dto: CreateIncidentCommentDto) {
    await this.getOne(id);

    return this.prisma.incidentComment.create({
      data: {
        incidentId: id,
        author: dto.author,
        message: dto.message,
      },
    });
  }

  private buildLifecycleForCreate(params: {
    occurredAt: Date;
    status: PrismaIncidentStatus | 'OPEN';
  }) {
    const { occurredAt, status } = params;
    const now = new Date();

    if (status === PrismaIncidentStatus.OPEN) {
      return {
        acknowledgedAt: undefined,
        resolvedAt: undefined,
        downtimeMinutes: undefined,
      };
    }

    if (status === PrismaIncidentStatus.IN_PROGRESS) {
      return {
        acknowledgedAt: now,
        resolvedAt: undefined,
        downtimeMinutes: undefined,
      };
    }

    return {
      acknowledgedAt: now,
      resolvedAt: now,
      downtimeMinutes: this.calculateDowntimeMinutes(occurredAt, now),
    };
  }

  private buildLifecycleForTransition(
    incident: Awaited<ReturnType<IncidentsService['getOne']>>,
    nextStatus: PrismaIncidentStatus,
  ) {
    const currentStatus = incident.status;
    const isValidTransition =
      (currentStatus === PrismaIncidentStatus.OPEN &&
        (nextStatus === PrismaIncidentStatus.IN_PROGRESS ||
          nextStatus === PrismaIncidentStatus.RESOLVED)) ||
      (currentStatus === PrismaIncidentStatus.IN_PROGRESS &&
        nextStatus === PrismaIncidentStatus.RESOLVED) ||
      (currentStatus === PrismaIncidentStatus.RESOLVED &&
        nextStatus === PrismaIncidentStatus.IN_PROGRESS);

    if (!isValidTransition) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${nextStatus}`,
      );
    }

    const now = new Date();

    if (nextStatus === PrismaIncidentStatus.IN_PROGRESS) {
      return {
        acknowledgedAt: incident.acknowledgedAt ?? now,
        resolvedAt: null,
        downtimeMinutes: null,
      };
    }

    return {
      acknowledgedAt: incident.acknowledgedAt ?? now,
      resolvedAt: now,
      downtimeMinutes: this.calculateDowntimeMinutes(incident.occurredAt, now),
    };
  }

  private calculateDowntimeMinutes(start: Date, end: Date) {
    const durationMs = end.getTime() - start.getTime();
    return Math.max(0, Math.round(durationMs / 60000));
  }
}
