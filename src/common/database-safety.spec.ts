import {
  assertSafeSeedDatabase,
  assertSafeTestDatabase,
  parseDatabaseUrl,
} from '../../scripts/database-safety';

describe('database safety guards', () => {
  it('parses the database target from a connection string', () => {
    expect(
      parseDatabaseUrl(
        'postgresql://postgres:postgres@localhost:5432/incident_tracker?schema=public',
      ),
    ).toMatchObject({
      databaseName: 'incident_tracker',
      host: 'localhost',
    });
  });

  it('allows the local dedicated test database', () => {
    expect(() => {
      assertSafeTestDatabase(
        'postgresql://postgres:postgres@localhost:5432/incident_tracker_test?schema=public',
      );
    }).not.toThrow();
  });

  it('rejects test database setup for non-test database names', () => {
    expect(() => {
      assertSafeTestDatabase(
        'postgresql://postgres:postgres@localhost:5432/incident_tracker?schema=public',
      );
    }).toThrow('does not end with "_test"');
  });

  it('allows seeding the local development database', () => {
    expect(() => {
      assertSafeSeedDatabase(
        'postgresql://postgres:postgres@localhost:5432/incident_tracker?schema=public',
      );
    }).not.toThrow();
  });

  it('allows seeding the local test database in test mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env['NODE_ENV'] = 'test';

    expect(() => {
      assertSafeSeedDatabase(
        'postgresql://postgres:postgres@localhost:5432/incident_tracker_test?schema=public',
      );
    }).not.toThrow();

    process.env['NODE_ENV'] = originalNodeEnv;
  });

  it('rejects seeding remote databases', () => {
    expect(() => {
      assertSafeSeedDatabase(
        'postgresql://postgres:postgres@db.example.com:5432/incident_tracker?schema=public',
      );
    }).toThrow('non-local database host');
  });
});
