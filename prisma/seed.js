require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
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
  await prisma.incidentComment.deleteMany();
  await prisma.incident.deleteMany();

  await prisma.incident.create({
    data: {
      title: 'Hydraulic leak on press 04',
      description: 'Oil leak detected near the main cylinder during the morning shift.',
      machineId: 'PRESS-04',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      occurredAt: new Date('2026-04-10T06:45:00.000Z'),
      acknowledgedAt: new Date('2026-04-10T06:58:00.000Z'),
      downtimeMinutes: 95,
      comments: {
        create: [
          {
            author: 'shift-supervisor',
            message: 'Operator stopped the machine after pressure dropped below threshold.',
          },
          {
            author: 'maintenance-tech',
            message: 'Seal kit requested and line isolated for repair.',
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
      comments: {
        create: [
          {
            author: 'monitoring-system',
            message: 'Thermal sensor exceeded configured threshold.',
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
      comments: {
        create: [
          {
            author: 'maintenance-tech',
            message: 'Loose mounting bolts were tightened and alignment was rechecked.',
          },
          {
            author: 'qa-inspector',
            message: 'Test cycle completed successfully after repair.',
          },
        ],
      },
    },
  });

  const incidentCount = await prisma.incident.count();
  const commentCount = await prisma.incidentComment.count();

  console.log(`Seeded ${incidentCount} incidents and ${commentCount} comments.`);
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
