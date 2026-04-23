import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { MachinesModule } from '../machines/machines.module';
import { MetricsModule } from '../metrics/metrics.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [PrismaModule, MachinesModule, JobsModule, MetricsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
})
export class IncidentsModule {}
