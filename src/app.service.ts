import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MetricsService } from './metrics/metrics.service';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  getHealth() {
    return {
      name: 'maintenance-incident-tracker-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.metricsService.setDatabaseReady(true);
    } catch {
      this.metricsService.setDatabaseReady(false);
      throw new ServiceUnavailableException(
        'Database connection is unavailable.',
      );
    }

    return {
      name: 'maintenance-incident-tracker-api',
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}
