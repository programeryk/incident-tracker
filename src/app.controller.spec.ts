import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsService } from './metrics/metrics.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: MetricsService,
          useValue: {
            setDatabaseReady: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return an ok payload', () => {
      expect(appController.getHealth()).toMatchObject({
        name: 'maintenance-incident-tracker-api',
        status: 'ok',
      });
    });
  });

  describe('readiness', () => {
    it('should return a ready payload', async () => {
      await expect(appController.getReadiness()).resolves.toMatchObject({
        name: 'maintenance-incident-tracker-api',
        status: 'ready',
      });
    });
  });
});
