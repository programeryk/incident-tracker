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
        status: 'IN_PROGRESS',
      })
      .expect(200);

    const updatedIncident = response.body as IncidentResponse;

    expect(updatedIncident).toMatchObject({
      id: incident.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    });
    expect(updatedIncident.acknowledgedAt).toEqual(expect.any(String));
    expect(updatedIncident.resolvedAt).toBeNull();
    expect(updatedIncident.downtimeMinutes).toBeNull();
  });

  it('PATCH /incidents/:id/status returns 404 for a missing incident', () => {
    return request(context.httpServer)
      .patch('/incidents/non-existent-id/status')
      .send({
        status: 'RESOLVED',
      })
      .expect(404);
  });

  it('PATCH /incidents/:id/status resolves an in-progress incident automatically', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Cooling fan anomaly',
        machineId: 'COOLING-02',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        occurredAt: new Date('2026-04-12T10:00:00.000Z'),
        acknowledgedAt: new Date('2026-04-12T10:05:00.000Z'),
      },
    });

    const response = await request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'RESOLVED',
      })
      .expect(200);

    const updatedIncident = response.body as IncidentResponse;

    expect(updatedIncident.status).toBe('RESOLVED');
    expect(updatedIncident.acknowledgedAt).toBe('2026-04-12T10:05:00.000Z');
    expect(updatedIncident.resolvedAt).toEqual(expect.any(String));
    expect(updatedIncident.downtimeMinutes).toEqual(expect.any(Number));
  });

  it('PATCH /incidents/:id/status reopens a resolved incident', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Sensor anomaly',
        machineId: 'SENSOR-02',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        occurredAt: new Date('2026-04-12T10:00:00.000Z'),
        acknowledgedAt: new Date('2026-04-12T10:05:00.000Z'),
        resolvedAt: new Date('2026-04-12T11:00:00.000Z'),
        downtimeMinutes: 60,
      },
    });

    const response = await request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'IN_PROGRESS',
      })
      .expect(200);

    const updatedIncident = response.body as IncidentResponse;

    expect(updatedIncident.status).toBe('IN_PROGRESS');
    expect(updatedIncident.acknowledgedAt).toBe('2026-04-12T10:05:00.000Z');
    expect(updatedIncident.resolvedAt).toBeNull();
    expect(updatedIncident.downtimeMinutes).toBeNull();
  });

  it('rejects invalid transitions', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Motor temperature spike',
        machineId: 'MOTOR-03',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
      },
    });

    const response = await request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'OPEN',
      })
      .expect(400);

    const errorResponse = response.body as ErrorResponse;

    expect(errorResponse.message).toContain(
      'Invalid status transition from IN_PROGRESS to OPEN',
    );
  });
});
