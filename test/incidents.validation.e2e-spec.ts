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
});
