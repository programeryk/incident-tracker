import request from 'supertest';
import {
  createTestApp,
  resetDatabase,
  type IncidentResponse,
  type PaginatedIncidentsResponse,
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

    const allIncidentBodies = allIncidents.body as PaginatedIncidentsResponse;

    expect(allIncidentBodies.data).toHaveLength(3);
    expect(allIncidentBodies.meta).toMatchObject({
      page: 1,
      pageSize: 20,
      itemCount: 3,
      pageCount: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    const byMachine = await request(context.httpServer)
      .get('/incidents')
      .query({ machineId: 'PRESS-01' })
      .expect(200);

    const machineFilteredBodies = byMachine.body as PaginatedIncidentsResponse;

    expect(machineFilteredBodies.data).toHaveLength(2);
    expect(
      machineFilteredBodies.data.every((incident) => {
        return incident.machineId === 'PRESS-01';
      }),
    ).toBe(true);

    const byTrimmedMachine = await request(context.httpServer)
      .get('/incidents')
      .query({ machineId: '  PRESS-01  ' })
      .expect(200);

    const trimmedMachineFilteredBodies =
      byTrimmedMachine.body as PaginatedIncidentsResponse;

    expect(trimmedMachineFilteredBodies.data).toHaveLength(2);
    expect(
      trimmedMachineFilteredBodies.data.every((incident) => {
        return incident.machineId === 'PRESS-01';
      }),
    ).toBe(true);

    const byPartialMachine = await request(context.httpServer)
      .get('/incidents')
      .query({ machineId: 'press' })
      .expect(200);

    const partialMachineFilteredBodies =
      byPartialMachine.body as PaginatedIncidentsResponse;

    expect(partialMachineFilteredBodies.data).toHaveLength(3);

    const byStatus = await request(context.httpServer)
      .get('/incidents')
      .query({ status: 'IN_PROGRESS' })
      .expect(200);

    const statusFilteredBodies = byStatus.body as PaginatedIncidentsResponse;

    expect(statusFilteredBodies.data).toHaveLength(1);
    expect(statusFilteredBodies.data[0]).toMatchObject({
      machineId: 'PRESS-02',
      status: 'IN_PROGRESS',
    });

    const byPriority = await request(context.httpServer)
      .get('/incidents')
      .query({ priority: 'CRITICAL' })
      .expect(200);

    const priorityFilteredBodies =
      byPriority.body as PaginatedIncidentsResponse;

    expect(priorityFilteredBodies.data).toHaveLength(1);
    expect(priorityFilteredBodies.data[0]).toMatchObject({
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

    const dateRangeFilteredBodies =
      byDateRange.body as PaginatedIncidentsResponse;

    expect(dateRangeFilteredBodies.data).toHaveLength(1);
    expect(dateRangeFilteredBodies.data[0]).toMatchObject({
      machineId: 'PRESS-02',
    });
  });

  it('GET /incidents applies partial area and line filters', async () => {
    await context.prisma.machine.createMany({
      data: [
        {
          code: 'FILTER-PRESS-01',
          name: 'Filter Press 01',
          area: 'Press Hall',
          line: 'Line 3',
        },
        {
          code: 'FILTER-PACK-01',
          name: 'Filter Pack 01',
          area: 'Packaging',
          line: 'Line 1',
        },
      ],
      skipDuplicates: true,
    });
    await context.prisma.incident.createMany({
      data: [
        {
          title: 'Press hall incident',
          machineId: 'FILTER-PRESS-01',
          priority: 'HIGH',
        },
        {
          title: 'Packaging incident',
          machineId: 'FILTER-PACK-01',
          priority: 'LOW',
        },
      ],
    });

    const byArea = await request(context.httpServer)
      .get('/incidents')
      .query({ area: 'press' })
      .expect(200);

    const areaFilteredBodies = byArea.body as PaginatedIncidentsResponse;

    expect(areaFilteredBodies.data).toHaveLength(1);
    expect(areaFilteredBodies.data[0]).toMatchObject({
      machineId: 'FILTER-PRESS-01',
    });

    const byLine = await request(context.httpServer)
      .get('/incidents')
      .query({ line: 'ne 1' })
      .expect(200);

    const lineFilteredBodies = byLine.body as PaginatedIncidentsResponse;

    expect(lineFilteredBodies.data).toHaveLength(1);
    expect(lineFilteredBodies.data[0]).toMatchObject({
      machineId: 'FILTER-PACK-01',
    });
  });

  it('GET /incidents applies page and pageSize', async () => {
    await context.prisma.incident.createMany({
      data: [
        {
          title: 'Oldest event',
          machineId: 'PAGER-01',
          priority: 'LOW',
          occurredAt: new Date('2026-04-10T07:00:00.000Z'),
        },
        {
          title: 'Middle event',
          machineId: 'PAGER-02',
          priority: 'MEDIUM',
          occurredAt: new Date('2026-04-11T07:00:00.000Z'),
        },
        {
          title: 'Newest event',
          machineId: 'PAGER-03',
          priority: 'HIGH',
          occurredAt: new Date('2026-04-12T07:00:00.000Z'),
        },
      ],
    });

    const response = await request(context.httpServer)
      .get('/incidents')
      .query({ page: 2, pageSize: 2 })
      .expect(200);

    const body = response.body as PaginatedIncidentsResponse;

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      title: 'Oldest event',
      machineId: 'PAGER-01',
    });
    expect(body.meta).toMatchObject({
      page: 2,
      pageSize: 2,
      itemCount: 3,
      pageCount: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('GET /incidents returns empty data for pages beyond the result set', async () => {
    await context.prisma.incident.create({
      data: {
        title: 'Single event',
        machineId: 'PAGER-04',
        priority: 'LOW',
      },
    });

    const response = await request(context.httpServer)
      .get('/incidents')
      .query({ page: 3, pageSize: 10 })
      .expect(200);

    const body = response.body as PaginatedIncidentsResponse;

    expect(body.data).toEqual([]);
    expect(body.meta).toMatchObject({
      page: 3,
      pageSize: 10,
      itemCount: 1,
      pageCount: 1,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('GET /incidents rejects inverted date ranges', () => {
    return request(context.httpServer)
      .get('/incidents')
      .query({
        fromDate: '2026-04-12T00:00:00.000Z',
        toDate: '2026-04-11T23:59:59.999Z',
      })
      .expect(400);
  });

  it('GET /incidents rejects invalid pagination parameters', async () => {
    await request(context.httpServer)
      .get('/incidents')
      .query({ page: 0 })
      .expect(400);

    await request(context.httpServer)
      .get('/incidents')
      .query({ pageSize: 101 })
      .expect(400);

    await request(context.httpServer)
      .get('/incidents')
      .query({ page: 'not-a-number' })
      .expect(400);
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
