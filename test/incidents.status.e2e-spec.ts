import request from 'supertest';
import {
  createTestApp,
  resetDatabase,
  type ErrorResponse,
  type IncidentResponse,
  type TestAppContext,
} from './utils/setup-e2e';

describe('Incident Status API (e2e)', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(context.prisma);
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('PATCH /incidents/:id/status updates status fields', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Cooling circuit interruption',
        machineId: 'COOLING-01',
        priority: 'HIGH',
        occurredAt: new Date('2026-04-12T10:00:00.000Z'),
      },
    });

    const response = await request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'RESOLVED',
        resolvedAt: '2026-04-12T12:00:00.000Z',
        downtimeMinutes: 90,
      })
      .expect(200);

    const updatedIncident = response.body as IncidentResponse;

    expect(updatedIncident).toMatchObject({
      id: incident.id,
      status: 'RESOLVED',
      downtimeMinutes: 90,
      priority: 'HIGH',
    });
    expect(updatedIncident.resolvedAt).toBe('2026-04-12T12:00:00.000Z');
  });

  it('PATCH /incidents/:id/status returns 404 for a missing incident', () => {
    return request(context.httpServer)
      .patch('/incidents/non-existent-id/status')
      .send({
        status: 'RESOLVED',
      })
      .expect(404);
  });

  it('rejects resolved status updates without resolvedAt', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Cooling fan anomaly',
        machineId: 'COOLING-02',
        priority: 'MEDIUM',
      },
    });

    const response = await request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'RESOLVED',
      })
      .expect(400);

    const errorResponse = response.body as ErrorResponse;

    expect(errorResponse.message).toContain(
      'resolvedAt is required when status is RESOLVED or CLOSED',
    );
  });

  it('rejects resolvedAt for non-resolved statuses', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Sensor anomaly',
        machineId: 'SENSOR-02',
        priority: 'MEDIUM',
      },
    });

    const response = await request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'IN_PROGRESS',
        resolvedAt: '2026-04-12T12:00:00.000Z',
      })
      .expect(400);

    const errorResponse = response.body as ErrorResponse;

    expect(errorResponse.message).toContain(
      'resolvedAt can only be set when status is RESOLVED or CLOSED',
    );
  });

  it('rejects resolvedAt earlier than occurredAt', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Motor temperature spike',
        machineId: 'MOTOR-03',
        priority: 'HIGH',
        occurredAt: new Date('2026-04-12T14:00:00.000Z'),
      },
    });

    const response = await request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'RESOLVED',
        resolvedAt: '2026-04-12T12:00:00.000Z',
      })
      .expect(400);

    const errorResponse = response.body as ErrorResponse;

    expect(errorResponse.message).toContain(
      'resolvedAt cannot be earlier than occurredAt',
    );
  });
});
