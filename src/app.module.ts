import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IncidentsModule } from './incidents/incidents.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [IncidentsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
