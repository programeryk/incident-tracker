import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IncidentEventType,
  IncidentPriority,
  IncidentStatus as PrismaIncidentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { JobsService } from '../jobs/jobs.service';
import { MachinesService } from '../machines/machines.service';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

const userSummarySelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} satisfies Prisma.UserSelect;

const incidentInclude = {
  machine: true,
  createdByUser: { select: userSummarySelect },
  assignedToUser: { select: userSummarySelect },
  acknowledgedByUser: { select: userSummarySelect },
  resolvedByUser: { select: userSummarySelect },
  comments: {
    include: {
      user: { select: userSummarySelect },
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
} satisfies Prisma.IncidentInclude;

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly machinesService: MachinesService,
    private readonly jobsService: JobsService,
    private readonly metricsService: MetricsService,
  ) {}

  async create(dto: CreateIncidentDto, actor?: AuthUser) {
    const status = dto.status ?? PrismaIncidentStatus.OPEN;
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    if (occurredAt.getTime() > Date.now()) {
      throw new BadRequestException('occurredAt cannot be in the future.');
    }

    const lifecycle = this.buildLifecycleForCreate({
      occurredAt,
      status,
    });
    const machineCode = await this.machinesService.ensureMachineForIncident(
      dto.machineId,
      actor,
    );
    await this.ensureAssignableUser(dto.assignedToUserId);

    const incident = await this.prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          title: dto.title,
          description: dto.description,
          machineId: machineCode,
          priority: dto.priority,
          status,
          occurredAt: dto.occurredAt ? occurredAt : undefined,
          acknowledgedAt: lifecycle.acknowledgedAt,
          resolvedAt: lifecycle.resolvedAt,
          downtimeMinutes: lifecycle.downtimeMinutes,
          createdByUserId: actor?.id,
          assignedToUserId: dto.assignedToUserId,
          acknowledgedByUserId: lifecycle.acknowledgedAt
            ? actor?.id
            : undefined,
          resolvedByUserId: lifecycle.resolvedAt ? actor?.id : undefined,
        },
        include: incidentInclude,
      });

      await this.createEvent(tx, {
        incidentId: created.id,
        actorUserId: actor?.id,
        type: IncidentEventType.CREATED,
        message: 'Incident created.',
        metadata: {
          status,
          priority: dto.priority,
          machineId: machineCode,
          assignedToUserId: dto.assignedToUserId,
        },
      });

      return created;
    });

    if (incident.priority === IncidentPriority.CRITICAL) {
      await this.jobsService.enqueueCriticalIncidentNotification(incident.id);
    }

    return incident;
  }

  async getAll(query: ListIncidentsQueryDto) {
    if (query.fromDate && query.toDate) {
      const fromDate = new Date(query.fromDate);
      const toDate = new Date(query.toDate);

      if (fromDate.getTime() > toDate.getTime()) {
        throw new BadRequestException('fromDate cannot be after toDate.');
      }
    }

    const andFilters: Prisma.IncidentWhereInput[] = [];

    if (query.machineId) {
      andFilters.push({
        OR: [
          {
            machineId: {
              contains: query.machineId,
              mode: 'insensitive',
            },
          },
          {
            machine: {
              name: {
                contains: query.machineId,
                mode: 'insensitive',
              },
            },
          },
        ],
      });
    }

    if (query.area) {
      andFilters.push({
        machine: {
          area: {
            contains: query.area,
            mode: 'insensitive',
          },
        },
      });
    }

    if (query.line) {
      andFilters.push({
        machine: {
          line: {
            contains: query.line,
            mode: 'insensitive',
          },
        },
      });
    }

    const baseWhere: Prisma.IncidentWhereInput = {
      status: query.activeOnly
        ? { not: PrismaIncidentStatus.RESOLVED }
        : query.status,
      priority: query.priority,
      assignedToUserId: query.assignedToUserId,
      createdByUserId: query.createdByUserId,
      AND: andFilters.length ? andFilters : undefined,
      occurredAt:
        query.fromDate || query.toDate
          ? {
              gte: query.fromDate ? new Date(query.fromDate) : undefined,
              lte: query.toDate ? new Date(query.toDate) : undefined,
            }
          : undefined,
    };
    const where: Prisma.IncidentWhereInput = baseWhere;

    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;
    const orderBy: Prisma.IncidentOrderByWithRelationInput[] = [
      { occurredAt: 'desc' },
      { id: 'desc' },
    ];

    const [itemCount, data] = await this.prisma.$transaction([
      this.prisma.incident.count({ where }),
      this.prisma.incident.findMany({
        where,
        skip,
        take: pageSize,
        include: incidentInclude,
        orderBy,
      }),
    ]);

    const pageCount = Math.ceil(itemCount / pageSize);

    return {
      data,
      meta: {
        page,
        pageSize,
        itemCount,
        pageCount,
        hasNextPage: page < pageCount,
        hasPreviousPage: page > 1 && pageCount > 0,
      },
    };
  }

  async getOne(id: string, actor?: AuthUser) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: incidentInclude,
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${id} was not found.`);
    }

    this.assertCanAccessIncident(incident, actor, 'view');

    return incident;
  }

  async updateStatus(
    id: string,
    dto: UpdateIncidentStatusDto,
    actor?: AuthUser,
  ) {
    const incident = await this.getOne(id, actor);
    this.assertCanAccessIncident(incident, actor, 'updateStatus');
    const lifecycle = this.buildLifecycleForTransition(incident, dto.status);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: { id },
        data: {
          status: dto.status,
          acknowledgedAt: lifecycle.acknowledgedAt,
          resolvedAt: lifecycle.resolvedAt,
          downtimeMinutes: lifecycle.downtimeMinutes,
          acknowledgedByUserId: lifecycle.acknowledgedAt ? actor?.id : null,
          resolvedByUserId: lifecycle.resolvedAt ? actor?.id : null,
        },
        include: incidentInclude,
      });

      await this.createEvent(tx, {
        incidentId: id,
        actorUserId: actor?.id,
        type:
          incident.status === PrismaIncidentStatus.RESOLVED &&
          dto.status === PrismaIncidentStatus.IN_PROGRESS
            ? IncidentEventType.REOPENED
            : IncidentEventType.STATUS_CHANGED,
        message: `Status changed from ${incident.status} to ${dto.status}.`,
        metadata: {
          from: incident.status,
          to: dto.status,
        },
      });

      return updated;
    });
  }

  async addComment(
    id: string,
    dto: CreateIncidentCommentDto,
    actor?: AuthUser,
  ) {
    const incident = await this.getOne(id, actor);
    this.assertCanAccessIncident(incident, actor, 'comment');

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.incidentComment.create({
        data: {
          incidentId: id,
          author: dto.author ?? actor?.name,
          userId: actor?.id,
          message: dto.message,
        },
        include: {
          user: { select: userSummarySelect },
        },
      });

      await this.createEvent(tx, {
        incidentId: id,
        actorUserId: actor?.id,
        type: IncidentEventType.COMMENTED,
        message: dto.message,
        metadata: {
          commentId: comment.id,
        },
      });

      return comment;
    });
  }

  async getEvents(id: string, actor?: AuthUser) {
    await this.getOne(id, actor);

    return this.prisma.incidentEvent.findMany({
      where: { incidentId: id },
      include: {
        actorUser: { select: userSummarySelect },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMetrics() {
    const [open, inProgress, critical, unresolvedByMachine, downtime] =
      await Promise.all([
        this.prisma.incident.count({ where: { status: 'OPEN' } }),
        this.prisma.incident.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.incident.count({
          where: {
            priority: 'CRITICAL',
            status: { not: 'RESOLVED' },
          },
        }),
        this.prisma.incident.groupBy({
          by: ['machineId'],
          where: { status: { not: 'RESOLVED' } },
          _count: { id: true },
        }),
        this.prisma.incident.aggregate({
          where: {
            downtimeMinutes: { not: null },
          },
          _avg: { downtimeMinutes: true },
        }),
      ]);

    const machineCodes = unresolvedByMachine.map((item) => item.machineId);
    const machines = await this.prisma.machine.findMany({
      where: { code: { in: machineCodes } },
      select: { code: true, area: true },
    });
    const areaByCode = new Map(
      machines.map((machine) => [machine.code, machine.area]),
    );
    const unresolvedByArea = unresolvedByMachine.reduce<Record<string, number>>(
      (accumulator, item) => {
        const area = areaByCode.get(item.machineId) ?? 'Unassigned';
        accumulator[area] = (accumulator[area] ?? 0) + item._count.id;
        return accumulator;
      },
      {},
    );

    return {
      open,
      inProgress,
      critical,
      unresolvedByArea,
      averageDowntimeMinutes: downtime._avg.downtimeMinutes ?? 0,
    };
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

  private async ensureAssignableUser(userId?: string) {
    if (!userId) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!user?.isActive) {
      throw new BadRequestException('Assigned user must be active.');
    }
  }

  private assertCanAccessIncident(
    incident: { assignedToUserId: string | null; status: PrismaIncidentStatus },
    actor: AuthUser | undefined,
    action: 'view' | 'comment' | 'updateStatus',
  ) {
    if (!actor) {
      return;
    }

    if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPERVISOR) {
      return;
    }

    if (actor.role === UserRole.OPERATOR) {
      if (action !== 'updateStatus') {
        return;
      }

      throw new ForbiddenException('Operators cannot update incident status.');
    }

    if (actor.role === UserRole.TECHNICIAN) {
      if (action === 'view') {
        return;
      }

      if (
        incident.status !== PrismaIncidentStatus.RESOLVED ||
        incident.assignedToUserId === actor.id
      ) {
        return;
      }
    }

    throw new ForbiddenException('You do not have access to this incident.');
  }

  private async createEvent(
    tx: Prisma.TransactionClient,
    data: {
      incidentId: string;
      actorUserId?: string;
      type: IncidentEventType;
      message?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    await tx.incidentEvent.create({
      data: {
        incidentId: data.incidentId,
        actorUserId: data.actorUserId,
        type: data.type,
        message: data.message,
        metadata: data.metadata,
      },
    });
    this.metricsService.recordIncidentEvent(data.type);
  }
}
