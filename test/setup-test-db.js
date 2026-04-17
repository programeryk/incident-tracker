require('dotenv').config({ path: '.env.test', override: true });

const { execFileSync } = require('node:child_process');
const { Client } = require('pg');
const {
  assertSafeTestDatabase,
  parseDatabaseUrl,
} = require('../scripts/database-safety');

const testDatabaseUrl = process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'DATABASE_URL is not set for e2e tests. Copy .env.test.example to .env.test before running npm run test:e2e.',
  );
}

const targetDatabase = assertSafeTestDatabase(testDatabaseUrl);

const createAdminDatabaseUrl = (connectionString) => {
  const url = new URL(connectionString);
  url.pathname = '/postgres';
  return url.toString();
};

const getDatabaseName = (connectionString) => {
  return parseDatabaseUrl(connectionString).databaseName;
};

const ensureTestDatabaseExists = async () => {
  const adminClient = new Client({
    connectionString: createAdminDatabaseUrl(testDatabaseUrl),
  });

  const databaseName = getDatabaseName(testDatabaseUrl);

  await adminClient.connect();

  const { rows } = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [databaseName],
  );

  if (rows.length === 0) {
    await adminClient.query(`CREATE DATABASE "${databaseName}"`);
  }

  await adminClient.end();
};

const resetTestDatabase = async () => {
  const client = new Client({
    connectionString: testDatabaseUrl,
  });

  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.end();
};

const applyMigrations = () => {
  const prismaCliEntrypoint = require.resolve('prisma/build/index.js');

  execFileSync(
    process.execPath,
    [prismaCliEntrypoint, 'migrate', 'deploy'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
      },
    },
  );
};

const verifyDatabaseConnection = async () => {
  const client = new Client({
    connectionString: testDatabaseUrl,
  });

  await client.connect();
  await client.query('SELECT 1');
  await client.end();
};

async function main() {
  console.log(
    `Preparing test database "${targetDatabase.databaseName}" on "${targetDatabase.host}".`,
  );
  await ensureTestDatabaseExists();
  await resetTestDatabase();
  applyMigrations();
  await verifyDatabaseConnection();
}

main().catch((error) => {
  console.error('Failed to prepare the test database:', error);
  process.exit(1);
});
