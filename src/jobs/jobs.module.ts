import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [PrismaModule, MetricsModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
