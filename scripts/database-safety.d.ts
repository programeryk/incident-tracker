export type DatabaseTarget = {
  databaseName: string;
  host: string;
  url: URL;
};

export function parseDatabaseUrl(connectionString: string): DatabaseTarget;

export function assertSafeTestDatabase(
  connectionString: string,
): DatabaseTarget;

export function assertSafeSeedDatabase(
  connectionString: string,
): DatabaseTarget;
