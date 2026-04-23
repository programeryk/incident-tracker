import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { IncidentsModule } from './incidents/incidents.module';
import { JobsModule } from './jobs/jobs.module';
import { MachinesModule } from './machines/machines.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    MetricsModule,
    AuthModule,
    UsersModule,
    MachinesModule,
    JobsModule,
    IncidentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
