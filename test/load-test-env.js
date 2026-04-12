const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set for e2e tests. Copy .env.test.example to .env.test before running npm run test:e2e.',
  );
}
