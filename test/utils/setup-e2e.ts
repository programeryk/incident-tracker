import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

export type TestAppContext = {
  app: INestApplication;
  httpServer: App;
  prisma: PrismaService;
};

export type IncidentResponse = {
  id: string;
  title: string;
  machineId: string;
  priority: string;
  status: string;
  occurredAt?: string;
  resolvedAt?: string | null;
  downtimeMinutes?: number | null;
  comments: Array<{
    id: string;
    author?: string | null;
    message: string;
  }>;
};

export type CommentResponse = {
  incidentId: string;
  author?: string | null;
  message: string;
};

export async function createTestApp(): Promise<TestAppContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  return {
    app,
    httpServer: app.getHttpServer() as App,
    prisma: app.get(PrismaService),
  };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.incidentComment.deleteMany();
  await prisma.incident.deleteMany();
}
