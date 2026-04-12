import request from 'supertest';
import {
  createTestApp,
  resetDatabase,
  type CommentResponse,
  type TestAppContext,
} from './utils/setup-e2e';

describe('Incident Comments API (e2e)', () => {
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

  it('POST /incidents/:id/comments adds a comment to an incident', async () => {
    const incident = await context.prisma.incident.create({
      data: {
        title: 'Unexpected stop on filler',
        machineId: 'FILLER-09',
        priority: 'HIGH',
      },
    });

    const response = await request(context.httpServer)
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

    const updatedIncident = await context.prisma.incident.findUnique({
      where: { id: incident.id },
      include: { comments: true },
    });

    expect(updatedIncident?.comments).toHaveLength(1);
  });

  it('POST /incidents/:id/comments returns 404 for a missing incident', () => {
    return request(context.httpServer)
      .post('/incidents/non-existent-id/comments')
      .send({
        message: 'This incident does not exist.',
      })
      .expect(404);
  });
});
