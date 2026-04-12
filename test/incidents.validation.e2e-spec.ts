import request from 'supertest';
import {
  createTestApp,
  resetDatabase,
  type TestAppContext,
} from './utils/setup-e2e';

describe('Incident Validation API (e2e)', () => {
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

  it('rejects invalid create payloads with 400', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: '',
        machineId: 'MACHINE-003',
        priority: 'INVALID_PRIORITY',
      })
      .expect(400);
  });

  it('rejects empty machine identifiers with 400', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: 'Unexpected vibration',
        machineId: '',
        priority: 'HIGH',
      })
      .expect(400);
  });

  it('rejects whitespace-only titles with 400', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: '   ',
        machineId: 'MACHINE-003',
        priority: 'HIGH',
      })
      .expect(400);
  });

  it('rejects whitespace-only machine identifiers with 400', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: 'Unexpected vibration',
        machineId: '   ',
        priority: 'HIGH',
      })
      .expect(400);
  });

  it('rejects empty descriptions when provided', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: 'Unexpected vibration',
        machineId: 'MACHINE-007',
        priority: 'HIGH',
        description: '',
      })
      .expect(400);
  });

  it('rejects whitespace-only descriptions when provided', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: 'Unexpected vibration',
        machineId: 'MACHINE-007',
        priority: 'HIGH',
        description: '   ',
      })
      .expect(400);
  });

  it('rejects invalid status payloads with 400', () => {
    return request(context.httpServer)
      .patch('/incidents/non-existent-id/status')
      .send({
        status: 'INVALID_STATUS',
      })
      .expect(400);
  });

  it('rejects invalid comment payloads with 400', () => {
    return request(context.httpServer)
      .post('/incidents/non-existent-id/comments')
      .send({
        author: 'maintenance-tech',
      })
      .expect(400);
  });

  it('rejects empty comment messages with 400', () => {
    return request(context.httpServer)
      .post('/incidents/non-existent-id/comments')
      .send({
        author: 'maintenance-tech',
        message: '',
      })
      .expect(400);
  });

  it('rejects whitespace-only comment messages with 400', () => {
    return request(context.httpServer)
      .post('/incidents/non-existent-id/comments')
      .send({
        author: 'maintenance-tech',
        message: '   ',
      })
      .expect(400);
  });

  it('rejects empty authors when provided', () => {
    return request(context.httpServer)
      .post('/incidents/non-existent-id/comments')
      .send({
        author: '',
        message: 'Operator reported a restart loop.',
      })
      .expect(400);
  });

  it('rejects whitespace-only authors when provided', () => {
    return request(context.httpServer)
      .post('/incidents/non-existent-id/comments')
      .send({
        author: '   ',
        message: 'Operator reported a restart loop.',
      })
      .expect(400);
  });

  it('rejects extra properties in create payload with 400', () => {
    return request(context.httpServer)
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
    return request(context.httpServer)
      .get('/incidents')
      .query({ priority: 'NOT_REAL' })
      .expect(400);
  });

  it('rejects priority on the status endpoint with 400', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Unexpected vibration',
        machineId: 'MACHINE-009',
        priority: 'HIGH',
      },
    });

    return request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'IN_PROGRESS',
        priority: 'LOW',
      })
      .expect(400);
  });

  it('rejects acknowledgedAt on create because it is automatic', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: 'Unexpected vibration',
        machineId: 'MACHINE-007',
        priority: 'HIGH',
        acknowledgedAt: '2026-04-12T11:00:00.000Z',
      })
      .expect(400);
  });

  it('rejects resolvedAt on create because it is automatic', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: 'Unexpected vibration',
        machineId: 'MACHINE-007',
        priority: 'HIGH',
        resolvedAt: '2026-04-12T11:00:00.000Z',
      })
      .expect(400);
  });

  it('rejects downtimeMinutes on create because it is automatic', () => {
    return request(context.httpServer)
      .post('/incidents')
      .send({
        title: 'Unexpected vibration',
        machineId: 'MACHINE-007',
        priority: 'HIGH',
        downtimeMinutes: 25,
      })
      .expect(400);
  });

  it('rejects resolvedAt on the status endpoint because it is automatic', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Unexpected vibration',
        machineId: 'MACHINE-010',
        priority: 'HIGH',
      },
    });

    return request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'RESOLVED',
        resolvedAt: '2026-04-12T11:00:00.000Z',
      })
      .expect(400);
  });

  it('rejects downtimeMinutes on the status endpoint because it is automatic', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Unexpected vibration',
        machineId: 'MACHINE-011',
        priority: 'HIGH',
      },
    });

    return request(context.httpServer)
      .patch(`/incidents/${incident.id}/status`)
      .send({
        status: 'RESOLVED',
        downtimeMinutes: 25,
      })
      .expect(400);
  });
});
