import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { TokenService } from '../../src/auth/token.service';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

export type TestAppContext = {
  app: INestApplication;
  httpServer: App;
  prisma: PrismaService;
  tokenService: TokenService;
};

export type IncidentResponse = {
  id: string;
  title: string;
  machineId: string;
  priority: string;
  status: string;
  acknowledgedAt?: string | null;
  occurredAt?: string;
  resolvedAt?: string | null;
  downtimeMinutes?: number | null;
  comments: Array<{
    id: string;
    author?: string | null;
    message: string;
  }>;
};

export type PaginatedIncidentsResponse = {
  data: IncidentResponse[];
  meta: {
    page: number;
    pageSize: number;
    itemCount: number;
    pageCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type CommentResponse = {
  incidentId: string;
  author?: string | null;
  message: string;
};

export type ErrorResponse = {
  message: string | string[];
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
    tokenService: app.get(TokenService),
  };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.incidentEvent.deleteMany();
  await prisma.incidentComment.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: { not: 'test-admin@example.com' },
    },
  });
  await prisma.user.upsert({
    where: { email: 'test-admin@example.com' },
    update: {
      name: 'Test Admin',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'test-admin@example.com',
      name: 'Test Admin',
      role: 'ADMIN',
      passwordHash: 'test-password-hash',
    },
  });
  await prisma.machine.createMany({
    data: [
      'MACHINE-003',
      'MACHINE-007',
      'MACHINE-009',
      'MACHINE-010',
      'MACHINE-011',
      'COOLING-01',
      'COOLING-02',
      'SENSOR-02',
      'MOTOR-03',
      'PRESS-01',
      'PRESS-02',
      'PAGER-01',
      'PAGER-02',
      'PAGER-03',
      'PAGER-04',
      'LINE-04',
      'PACK-01',
      'VALVE-02',
      'FILLER-09',
    ].map((code) => ({
      code,
      name: code,
      area: 'Test Area',
    })),
    skipDuplicates: true,
  });
}
