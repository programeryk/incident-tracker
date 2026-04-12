import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type IncidentResponse = {
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

type CommentResponse = {
  incidentId: string;
  author?: string | null;
  message: string;
};

describe('Incident API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.incidentComment.deleteMany();
    await prisma.incident.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / returns the health payload', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          name: 'maintenance-incident-tracker-api',
          status: 'ok',
        });
      });
  });

  it('POST /incidents creates an incident', async () => {
    const response = await request(app.getHttpServer())
      .post('/incidents')
      .send({
        title: 'Hydraulic pressure drop on line 3',
        description:
          'Pressure dropped below threshold and triggered emergency stop.',
        machineId: 'MACHINE-003',
        priority: 'HIGH',
        occurredAt: '2026-04-12T08:30:00.000Z',
      })
      .expect(201);

    const createdIncident = response.body as IncidentResponse;

    expect(createdIncident).toMatchObject({
      title: 'Hydraulic pressure drop on line 3',
      machineId: 'MACHINE-003',
      priority: 'HIGH',
      status: 'OPEN',
    });
    expect(createdIncident).toHaveProperty('id');
    expect(createdIncident.id).toEqual(expect.any(String));
    expect(createdIncident.comments).toEqual([]);
    expect(createdIncident.occurredAt).toBe('2026-04-12T08:30:00.000Z');
  });

  it('GET /incidents returns incidents and applies filters', async () => {
    await prisma.incident.createMany({
      data: [
        {
          title: 'Leak on press 01',
          machineId: 'PRESS-01',
          priority: 'HIGH',
          status: 'OPEN',
          occurredAt: new Date('2026-04-10T07:00:00.000Z'),
        },
        {
          title: 'Motor overheating',
          machineId: 'PRESS-02',
          priority: 'CRITICAL',
          status: 'IN_PROGRESS',
          occurredAt: new Date('2026-04-11T09:15:00.000Z'),
        },
        {
          title: 'Sensor calibration drift',
          machineId: 'PRESS-01',
          priority: 'LOW',
          status: 'RESOLVED',
          occurredAt: new Date('2026-04-12T10:45:00.000Z'),
        },
      ],
    });

    const allIncidents = await request(app.getHttpServer())
      .get('/incidents')
      .expect(200);

    const allIncidentBodies = allIncidents.body as IncidentResponse[];

    expect(allIncidentBodies).toHaveLength(3);

    const byMachine = await request(app.getHttpServer())
      .get('/incidents')
      .query({ machineId: 'PRESS-01' })
      .expect(200);

    const machineFilteredBodies = byMachine.body as IncidentResponse[];

    expect(machineFilteredBodies).toHaveLength(2);
    expect(
      machineFilteredBodies.every((incident) => {
        return incident.machineId === 'PRESS-01';
      }),
    ).toBe(true);

    const byStatus = await request(app.getHttpServer())
      .get('/incidents')
      .query({ status: 'IN_PROGRESS' })
      .expect(200);

    const statusFilteredBodies = byStatus.body as IncidentResponse[];

    expect(statusFilteredBodies).toHaveLength(1);
    expect(statusFilteredBodies[0]).toMatchObject({
      machineId: 'PRESS-02',
      status: 'IN_PROGRESS',
    });

    const byPriority = await request(app.getHttpServer())
      .get('/incidents')
      .query({ priority: 'CRITICAL' })
      .expect(200);

    const priorityFilteredBodies = byPriority.body as IncidentResponse[];

    expect(priorityFilteredBodies).toHaveLength(1);
    expect(priorityFilteredBodies[0]).toMatchObject({
      machineId: 'PRESS-02',
      priority: 'CRITICAL',
    });

    const byDateRange = await request(app.getHttpServer())
      .get('/incidents')
      .query({
        fromDate: '2026-04-11T00:00:00.000Z',
        toDate: '2026-04-11T23:59:59.999Z',
      })
      .expect(200);

    const dateRangeFilteredBodies = byDateRange.body as IncidentResponse[];

    expect(dateRangeFilteredBodies).toHaveLength(1);
    expect(dateRangeFilteredBodies[0]).toMatchObject({
      machineId: 'PRESS-02',
    });
  });

  it('GET /incidents/:id returns an incident with comments', async () => {
    const incident = await prisma.incident.create({
      data: {
        title: 'Bearing temperature spike',
        machineId: 'LINE-04',
        priority: 'MEDIUM',
        comments: {
          create: [
            {
              author: 'operator',
              message: 'Initial alert raised by operator station.',
            },
            {
              author: 'technician',
              message: 'Inspection started and housing removed.',
            },
          ],
        },
      },
      include: {
        comments: true,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/incidents/${incident.id}`)
      .expect(200);

    const incidentBody = response.body as IncidentResponse;

    expect(incidentBody).toMatchObject({
      id: incident.id,
      title: 'Bearing temperature spike',
      machineId: 'LINE-04',
    });
    expect(incidentBody.comments).toHaveLength(2);
  });

  it('GET /incidents/:id returns 404 for a missing incident', () => {
    return request(app.getHttpServer())
      .get('/incidents/non-existent-id')
      .expect(404);
  });

  it('PATCH /incidents/:id/status updates status fields', async () => {
    const incident = await prisma.incident.create({
      data: {
        title: 'Cooling circuit interruption',
        machineId: 'COOLING-01',
        priority: 'HIGH',
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'RESOLVED',
        resolvedAt: '2026-04-12T12:00:00.000Z',
        downtimeMinutes: 90,
        priority: 'MEDIUM',
      })
      .expect(200);

    const updatedIncident = response.body as IncidentResponse;

    expect(updatedIncident).toMatchObject({
      id: incident.id,
      status: 'RESOLVED',
      downtimeMinutes: 90,
      priority: 'MEDIUM',
    });
    expect(updatedIncident.resolvedAt).toBe('2026-04-12T12:00:00.000Z');
  });

  it('PATCH /incidents/:id/status returns 404 for a missing incident', () => {
    return request(app.getHttpServer())
      .patch('/incidents/non-existent-id/status')
      .send({
        status: 'RESOLVED',
      })
      .expect(404);
  });

  it('POST /incidents/:id/comments adds a comment to an incident', async () => {
    const incident = await prisma.incident.create({
      data: {
        title: 'Unexpected stop on filler',
        machineId: 'FILLER-09',
        priority: 'HIGH',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/incidents/${incident.id}/comments`)
      .send({
        author: 'maintenance-tech',
        message: 'Restart attempt completed and diagnostics collected.',
      })
      .expect(201);

    const createdComment = response.body as CommentResponse;

    expect(createdComment).toMatchObject({
      incidentId: incident.id,
      author: 'maintenance-tech',
      message: 'Restart attempt completed and diagnostics collected.',
    });

    const updatedIncident = await prisma.incident.findUnique({
      where: { id: incident.id },
      include: { comments: true },
    });

    expect(updatedIncident?.comments).toHaveLength(1);
  });

  it('POST /incidents/:id/comments returns 404 for a missing incident', () => {
    return request(app.getHttpServer())
      .post('/incidents/non-existent-id/comments')
      .send({
        message: 'This incident does not exist.',
      })
      .expect(404);
  });

  it('rejects invalid create payloads with 400', () => {
    return request(app.getHttpServer())
      .post('/incidents')
      .send({
        title: '',
        machineId: 'MACHINE-003',
        priority: 'INVALID_PRIORITY',
      })
      .expect(400);
  });

  it('rejects invalid status payloads with 400', () => {
    return request(app.getHttpServer())
      .patch('/incidents/non-existent-id/status')
      .send({
        status: 'INVALID_STATUS',
      })
      .expect(400);
  });

  it('rejects invalid comment payloads with 400', () => {
    return request(app.getHttpServer())
      .post('/incidents/non-existent-id/comments')
      .send({
        author: 'maintenance-tech',
      })
      .expect(400);
  });

  it('rejects extra properties in create payload with 400', () => {
    return request(app.getHttpServer())
      .post('/incidents')
      .send({
        title: 'Unexpected vibration',
        machineId: 'MACHINE-007',
        priority: 'HIGH',
        hack: 'not allowed',
      })
      .expect(400);
  });

  it('rejects invalid incident filters with 400', () => {
    return request(app.getHttpServer())
      .get('/incidents')
      .query({ priority: 'NOT_REAL' })
      .expect(400);
  });
});
