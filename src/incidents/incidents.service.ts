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
    const acknowledgedAt = dto.acknowledgedAt
      ? new Date(dto.acknowledgedAt)
      : undefined;
    const resolvedAt = dto.resolvedAt ? new Date(dto.resolvedAt) : undefined;

    this.validateLifecycle({
      occurredAt,
      acknowledgedAt,
      resolvedAt,
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
        acknowledgedAt,
        resolvedAt,
        downtimeMinutes: dto.downtimeMinutes,
      },
      include: {
        comments: true,
      },
    });
  }

  async findAll(query: ListIncidentsQueryDto) {
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

  async findOne(id: string) {
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
    const incident = await this.findOne(id);
    const resolvedAt = dto.resolvedAt ? new Date(dto.resolvedAt) : undefined;

    this.validateLifecycle({
      occurredAt: incident.occurredAt,
      acknowledgedAt: incident.acknowledgedAt ?? undefined,
      resolvedAt,
      status: dto.status,
    });

    return this.prisma.incident.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt,
        downtimeMinutes: dto.downtimeMinutes,
      },
      include: {
        comments: true,
      },
    });
  }

  async addComment(id: string, dto: CreateIncidentCommentDto) {
    await this.findOne(id);

    return this.prisma.incidentComment.create({
      data: {
        incidentId: id,
        author: dto.author,
        message: dto.message,
      },
    });
  }

  private validateLifecycle(params: {
    occurredAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    status: PrismaIncidentStatus | 'OPEN';
  }) {
    const { occurredAt, acknowledgedAt, resolvedAt, status } = params;
    const isResolvedState = status === PrismaIncidentStatus.RESOLVED;

    if (isResolvedState && !resolvedAt) {
      throw new BadRequestException(
        'resolvedAt is required when status is RESOLVED',
      );
    }

    if (!isResolvedState && resolvedAt) {
      throw new BadRequestException(
        'resolvedAt can only be set when status is RESOLVED',
      );
    }

    if (acknowledgedAt && acknowledgedAt < occurredAt) {
      throw new BadRequestException(
        'acknowledgedAt cannot be earlier than occurredAt',
      );
    }

    if (resolvedAt && resolvedAt < occurredAt) {
      throw new BadRequestException(
        'resolvedAt cannot be earlier than occurredAt',
      );
    }
  }
}
