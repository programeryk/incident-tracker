const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const parseDatabaseUrl = (connectionString) => {
  const url = new URL(connectionString);
  const databaseName = url.pathname.replace(/^\//, '');

  return {
    databaseName,
    host: url.hostname,
    url,
  };
};

const assertLocalDatabase = (connectionString, context) => {
  const target = parseDatabaseUrl(connectionString);

  if (!LOCAL_HOSTS.has(target.host)) {
    throw new Error(
      `${context} refused to run against non-local database host "${target.host}".`,
    );
  }

  return target;
};

const assertSafeTestDatabase = (connectionString) => {
  const target = assertLocalDatabase(connectionString, 'Test database setup');

  if (!target.databaseName.endsWith('_test')) {
    throw new Error(
      `Test database setup refused to run because database "${target.databaseName}" does not end with "_test".`,
    );
  }

  return target;
};

const assertSafeSeedDatabase = (connectionString) => {
  const target = assertLocalDatabase(connectionString, 'Seed command');

  if (target.databaseName !== 'incident_tracker') {
    throw new Error(
      `Seed command refused to run because database "${target.databaseName}" is not "incident_tracker".`,
    );
  }

  return target;
};

module.exports = {
  assertSafeSeedDatabase,
  assertSafeTestDatabase,
  parseDatabaseUrl,
};
