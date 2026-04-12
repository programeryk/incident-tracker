import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService, PrismaService],
})
export class IncidentsModule {}
