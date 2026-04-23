import request from 'supertest';
import { UserRole } from '@prisma/client';
import {
  createTestApp,
  resetDatabase,
  type TestAppContext,
} from './utils/setup-e2e';

describe('Access control regressions (e2e)', () => {
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

  const createUserAndToken = async (role: UserRole, email: string) => {
    const user = await context.prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        role,
        passwordHash: 'test-password-hash',
      },
    });

    const token = await context.tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { user, token };
  };

  it('lets technicians see assigned, unassigned, and other active incidents', async () => {
    const technician = await createUserAndToken(
      UserRole.TECHNICIAN,
      'tech-a@example.com',
    );
    const otherTechnician = await createUserAndToken(
      UserRole.TECHNICIAN,
      'tech-b@example.com',
    );

    await context.prisma.incident.createMany({
      data: [
        {
          title: 'Assigned to current technician',
          machineId: 'MACHINE-003',
          priority: 'HIGH',
          assignedToUserId: technician.user.id,
        },
        {
          title: 'Unassigned incident',
          machineId: 'MACHINE-007',
          priority: 'MEDIUM',
        },
        {
          title: 'Assigned to someone else',
          machineId: 'MACHINE-009',
          priority: 'LOW',
          assignedToUserId: otherTechnician.user.id,
        },
      ],
    });

    const response = await request(context.httpServer)
      .get('/incidents')
      .set('Authorization', `Bearer ${technician.token}`)
      .expect(200);

    const titles = (
      response.body as { data: Array<{ title: string }> }
    ).data.map((incident) => incident.title);

    expect(titles).toEqual(
      expect.arrayContaining([
        'Assigned to current technician',
        'Unassigned incident',
        'Assigned to someone else',
      ]),
    );
  });

  it('allows technicians to update assigned, unassigned, and other active incidents', async () => {
    const technician = await createUserAndToken(
      UserRole.TECHNICIAN,
      'tech-a@example.com',
    );
    const otherTechnician = await createUserAndToken(
      UserRole.TECHNICIAN,
      'tech-b@example.com',
    );
    const assigned = await context.prisma.incident.create({
      data: {
        title: 'Assigned',
        machineId: 'MACHINE-003',
        priority: 'HIGH',
        assignedToUserId: technician.user.id,
      },
    });
    const unassigned = await context.prisma.incident.create({
      data: {
        title: 'Unassigned',
        machineId: 'MACHINE-007',
        priority: 'MEDIUM',
      },
    });
    const someoneElsesActive = await context.prisma.incident.create({
      data: {
        title: 'Someone else',
        machineId: 'MACHINE-009',
        priority: 'LOW',
        assignedToUserId: otherTechnician.user.id,
      },
    });
    const someoneElsesResolved = await context.prisma.incident.create({
      data: {
        title: 'Resolved for someone else',
        machineId: 'MACHINE-010',
        priority: 'LOW',
        status: 'RESOLVED',
        assignedToUserId: otherTechnician.user.id,
      },
    });

    await request(context.httpServer)
      .patch(`/incidents/${assigned.id}/status`)
      .set('Authorization', `Bearer ${technician.token}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(context.httpServer)
      .patch(`/incidents/${unassigned.id}/status`)
      .set('Authorization', `Bearer ${technician.token}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(context.httpServer)
      .patch(`/incidents/${someoneElsesActive.id}/status`)
      .set('Authorization', `Bearer ${technician.token}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(context.httpServer)
      .patch(`/incidents/${someoneElsesResolved.id}/status`)
      .set('Authorization', `Bearer ${technician.token}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(403);
  });

  it('lets supervisors view users but blocks operators', async () => {
    const supervisor = await createUserAndToken(
      UserRole.SUPERVISOR,
      'supervisor@example.com',
    );
    const operator = await createUserAndToken(
      UserRole.OPERATOR,
      'operator@example.com',
    );

    await request(context.httpServer)
      .get('/users')
      .set('Authorization', `Bearer ${supervisor.token}`)
      .expect(200);

    await request(context.httpServer)
      .get('/users')
      .set('Authorization', `Bearer ${operator.token}`)
      .expect(403);
  });

  it('prevents deactivating the last active admin', async () => {
    const admin = await context.prisma.user.findUniqueOrThrow({
      where: { email: 'test-admin@example.com' },
    });
    const token = await context.tokenService.signAccessToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    await request(context.httpServer)
      .patch(`/users/${admin.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false })
      .expect(400);
  });

  it('parses false boolean query parameters correctly', async () => {
    await context.prisma.machine.create({
      data: {
        code: 'INACTIVE-01',
        name: 'Inactive machine',
        area: 'Test Area',
        isActive: false,
      },
    });

    const machineResponse = await request(context.httpServer)
      .get('/machines?isActive=false')
      .expect(200);

    expect(
      (machineResponse.body as { data: Array<{ code: string }> }).data.map(
        (machine) => machine.code,
      ),
    ).toContain('INACTIVE-01');

    const resolved = await context.prisma.incident.create({
      data: {
        title: 'Resolved incident',
        machineId: 'MACHINE-003',
        priority: 'LOW',
        status: 'RESOLVED',
      },
    });

    const incidentResponse = await request(context.httpServer)
      .get('/incidents?activeOnly=false&status=RESOLVED')
      .expect(200);

    expect(
      (incidentResponse.body as { data: Array<{ id: string }> }).data.map(
        (incident) => incident.id,
      ),
    ).toContain(resolved.id);
  });
});
