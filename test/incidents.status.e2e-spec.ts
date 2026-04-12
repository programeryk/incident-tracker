import request from 'supertest';
import {
  createTestApp,
  resetDatabase,
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
      },
    });

    const response = await request(context.httpServer)
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
    return request(context.httpServer)
      .patch('/incidents/non-existent-id/status')
      .send({
        status: 'RESOLVED',
      })
      .expect(404);
  });
});
