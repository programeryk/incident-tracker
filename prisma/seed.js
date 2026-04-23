require('dotenv/config');

const argon2 = require('argon2');
const { PrismaClient, UserRole } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { assertSafeSeedDatabase } = require('../scripts/database-safety');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env before running the seed command.',
  );
}

const targetDatabase = assertSafeSeedDatabase(connectionString);
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    `Seeding database "${targetDatabase.databaseName}" on "${targetDatabase.host}".`,
  );

  await prisma.incidentEvent.deleteMany();
  await prisma.incidentComment.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash('ChangeMe12345!');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Operations Admin',
      role: UserRole.ADMIN,
      passwordHash,
    },
  });
  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@example.com',
      name: 'Shift Supervisor',
      role: UserRole.SUPERVISOR,
      passwordHash,
      createdByUserId: admin.id,
    },
  });
  const technician = await prisma.user.create({
    data: {
      email: 'tech@example.com',
      name: 'Maintenance Tech',
      role: UserRole.TECHNICIAN,
      passwordHash,
      createdByUserId: admin.id,
    },
  });
  const operator = await prisma.user.create({
    data: {
      email: 'operator@example.com',
      name: 'Line Operator',
      role: UserRole.OPERATOR,
      passwordHash,
      createdByUserId: admin.id,
    },
  });

  await prisma.machine.createMany({
    data: [
      {
        code: 'PRESS-04',
        name: 'Hydraulic Press 04',
        area: 'Press Hall',
        line: 'Line 3',
        description: 'Primary forming press on line 3.',
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      },
      {
        code: 'CONVEYOR-12',
        name: 'Packaging Conveyor 12',
        area: 'Packaging',
        line: 'Line 1',
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      },
      {
        code: 'PUMP-02',
        name: 'Cooling Pump 02',
        area: 'Utilities',
        line: 'Cooling Loop',
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      },
    ],
  });

  await prisma.incident.create({
    data: {
      title: 'Hydraulic leak on press 04',
      description:
        'Oil leak detected near the main cylinder during the morning shift.',
      machineId: 'PRESS-04',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      occurredAt: new Date('2026-04-10T06:45:00.000Z'),
      acknowledgedAt: new Date('2026-04-10T06:58:00.000Z'),
      downtimeMinutes: 95,
      createdByUserId: operator.id,
      assignedToUserId: technician.id,
      acknowledgedByUserId: technician.id,
      comments: {
        create: [
          {
            userId: supervisor.id,
            author: supervisor.name,
            message:
              'Operator stopped the machine after pressure dropped below threshold.',
          },
          {
            userId: technician.id,
            author: technician.name,
            message: 'Seal kit requested and line isolated for repair.',
          },
        ],
      },
      events: {
        create: [
          {
            actorUserId: operator.id,
            type: 'CREATED',
            message: 'Incident created.',
          },
          {
            actorUserId: technician.id,
            type: 'STATUS_CHANGED',
            message: 'Status changed from OPEN to IN_PROGRESS.',
          },
        ],
      },
    },
  });

  await prisma.incident.create({
    data: {
      title: 'Conveyor motor overheating in packaging zone',
      description:
        'Temperature alarm triggered twice within 20 minutes while line speed was above normal.',
      machineId: 'CONVEYOR-12',
      priority: 'CRITICAL',
      status: 'OPEN',
      occurredAt: new Date('2026-04-11T14:20:00.000Z'),
      createdByUserId: operator.id,
      assignedToUserId: technician.id,
      comments: {
        create: [
          {
            userId: operator.id,
            author: operator.name,
            message: 'Thermal sensor exceeded configured threshold.',
          },
        ],
      },
      events: {
        create: [
          {
            actorUserId: operator.id,
            type: 'CREATED',
            message: 'Incident created.',
          },
        ],
      },
    },
  });

  await prisma.incident.create({
    data: {
      title: 'Cooling pump vibration anomaly',
      description: 'Unusual vibration was observed during routine inspection.',
      machineId: 'PUMP-02',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      occurredAt: new Date('2026-04-09T09:10:00.000Z'),
      acknowledgedAt: new Date('2026-04-09T09:25:00.000Z'),
      resolvedAt: new Date('2026-04-09T11:00:00.000Z'),
      downtimeMinutes: 35,
      createdByUserId: operator.id,
      assignedToUserId: technician.id,
      acknowledgedByUserId: technician.id,
      resolvedByUserId: technician.id,
      comments: {
        create: [
          {
            userId: technician.id,
            author: technician.name,
            message:
              'Loose mounting bolts were tightened and alignment was rechecked.',
          },
          {
            userId: supervisor.id,
            author: supervisor.name,
            message: 'Test cycle completed successfully after repair.',
          },
        ],
      },
      events: {
        create: [
          {
            actorUserId: operator.id,
            type: 'CREATED',
            message: 'Incident created.',
          },
          {
            actorUserId: technician.id,
            type: 'STATUS_CHANGED',
            message: 'Status changed from IN_PROGRESS to RESOLVED.',
          },
        ],
      },
    },
  });

  const incidentCount = await prisma.incident.count();
  const commentCount = await prisma.incidentComment.count();
  const machineCount = await prisma.machine.count();
  const userCount = await prisma.user.count();

  console.log(
    `Seeded ${userCount} users, ${machineCount} machines, ${incidentCount} incidents, and ${commentCount} comments.`,
  );
  console.log('Demo password for all seeded users: ChangeMe12345!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Seeding failed:', error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
