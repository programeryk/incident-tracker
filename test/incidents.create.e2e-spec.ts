import request from 'supertest';
import {
  createTestApp,
  resetDatabase,
  type IncidentResponse,
  type TestAppContext,
} from './utils/setup-e2e';

describe('Incident Create API (e2e)', () => {
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

  it('POST /incidents creates an incident', async () => {
    const response = await request(context.httpServer)
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
});
