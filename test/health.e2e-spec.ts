import request from 'supertest';
import { createTestApp, type TestAppContext } from './utils/setup-e2e';

describe('Health API (e2e)', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('GET / returns the health payload', () => {
    return request(context.httpServer)
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          name: 'maintenance-incident-tracker-api',
          status: 'ok',
        });
      });
  });
});
