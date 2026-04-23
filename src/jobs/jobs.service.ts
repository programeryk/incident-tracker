import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';

type JobName =
  | 'critical-incident-notification'
  | 'stale-incident-scan'
  | 'daily-operational-summary';

@Injectable()
export class JobsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private connection?: IORedis;
  private queue?: Queue;
  private worker?: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  onApplicationBootstrap() {
    if (!env.REDIS_URL) {
      this.logger.warn('REDIS_URL is not set; background queues are disabled.');
      return;
    }

    this.connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue('incident-tracker', {
      connection: this.connection,
    });
    this.worker = new Worker(
      'incident-tracker',
      async (job) => {
        try {
          if (job.name === 'critical-incident-notification') {
            await this.handleCriticalIncidentNotification(
              job.data as { incidentId: string },
            );
          }

          if (job.name === 'stale-incident-scan') {
            await this.handleStaleIncidentScan();
          }

          if (job.name === 'daily-operational-summary') {
            await this.handleDailyOperationalSummary();
          }

          this.metricsService.recordQueueJob(job.name, 'completed');
        } catch (error) {
          this.metricsService.recordQueueJob(job.name, 'failed');
          throw error;
        }
      },
      { connection: this.connection },
    );

    void this.queue.add(
      'stale-incident-scan',
      {},
      { repeat: { every: 60 * 60 * 1000 }, removeOnComplete: 25 },
    );
    void this.queue.add(
      'daily-operational-summary',
      {},
      { repeat: { every: 24 * 60 * 60 * 1000 }, removeOnComplete: 14 },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueueCriticalIncidentNotification(incidentId: string) {
    await this.enqueue('critical-incident-notification', { incidentId });
  }

  private async enqueue(name: JobName, data: Record<string, unknown>) {
    if (!this.queue) {
      this.logger.log(
        `Queue disabled; would enqueue ${name} with ${JSON.stringify(data)}.`,
      );
      return;
    }

    await this.queue.add(name, data, { removeOnComplete: 50, attempts: 3 });
    this.metricsService.recordQueueJob(name, 'queued');
  }

  private async handleCriticalIncidentNotification(data: {
    incidentId: string;
  }) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: data.incidentId },
      include: { machine: true },
    });

    if (!incident) {
      return;
    }

    this.logger.log(
      `Critical incident notification placeholder: ${incident.title} on ${incident.machine.code}.`,
    );
  }

  private async handleStaleIncidentScan() {
    const threshold = new Date(
      Date.now() - env.STALE_INCIDENT_HOURS * 60 * 60 * 1000,
    );
    const staleCount = await this.prisma.incident.count({
      where: {
        status: { not: 'RESOLVED' },
        occurredAt: { lt: threshold },
      },
    });

    this.logger.log(`Stale incident scan found ${staleCount} open incidents.`);
  }

  private async handleDailyOperationalSummary() {
    const [open, inProgress, resolved] = await Promise.all([
      this.prisma.incident.count({ where: { status: 'OPEN' } }),
      this.prisma.incident.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.incident.count({ where: { status: 'RESOLVED' } }),
    ]);

    this.logger.log(
      `Daily summary placeholder: ${open} open, ${inProgress} in progress, ${resolved} resolved.`,
    );
  }
}
