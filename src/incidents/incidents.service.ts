import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIncidentDto) {
    return await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,
        machineId: dto.machineId,
        priority: dto.priority,
        status: dto.status ?? 'OPEN',
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        acknowledgedAt: dto.acknowledgedAt
          ? new Date(dto.acknowledgedAt)
          : undefined,
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
    await this.findOne(id);

    return this.prisma.incident.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: dto.resolvedAt ? new Date(dto.resolvedAt) : undefined,
        downtimeMinutes: dto.downtimeMinutes,
        priority: dto.priority,
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
}
