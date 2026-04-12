import request from 'supertest';
import {
  createTestApp,
  resetDatabase,
  type IncidentResponse,
  type TestAppContext,
} from './utils/setup-e2e';

describe('Incident Query API (e2e)', () => {
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

  it('GET /incidents returns incidents and applies filters', async () => {
    await context.prisma.incident.createMany({
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

    const allIncidents = await request(context.httpServer)
      .get('/incidents')
      .expect(200);

    const allIncidentBodies = allIncidents.body as IncidentResponse[];

    expect(allIncidentBodies).toHaveLength(3);

    const byMachine = await request(context.httpServer)
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

    const byStatus = await request(context.httpServer)
      .get('/incidents')
      .query({ status: 'IN_PROGRESS' })
      .expect(200);

    const statusFilteredBodies = byStatus.body as IncidentResponse[];

    expect(statusFilteredBodies).toHaveLength(1);
    expect(statusFilteredBodies[0]).toMatchObject({
      machineId: 'PRESS-02',
      status: 'IN_PROGRESS',
    });

    const byPriority = await request(context.httpServer)
      .get('/incidents')
      .query({ priority: 'CRITICAL' })
      .expect(200);

    const priorityFilteredBodies = byPriority.body as IncidentResponse[];

    expect(priorityFilteredBodies).toHaveLength(1);
    expect(priorityFilteredBodies[0]).toMatchObject({
      machineId: 'PRESS-02',
      priority: 'CRITICAL',
    });

    const byDateRange = await request(context.httpServer)
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
    const incident = await context.prisma.incident.create({
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

    const response = await request(context.httpServer)
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
    return request(context.httpServer)
      .get('/incidents/non-existent-id')
      .expect(404);
  });
});
