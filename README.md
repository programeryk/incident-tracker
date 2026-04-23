# Maintenance Incident Tracker API

Backend API and Next.js dashboard for reporting and managing machine incidents.

## Stack

- NestJS
- PostgreSQL
- Prisma ORM
- class-validator and class-transformer
- Swagger/OpenAPI
- Docker Compose
- Jest for unit and e2e tests
- Next.js frontend with Redux Toolkit Query

## What is included

- `GET /` health check
- `GET /ready` database readiness check
- `POST /incidents` create an incident
- `GET /incidents` filter and paginate incidents by machine, status, priority, and date range
- `GET /incidents/:id` fetch a single incident with comments
- `PATCH /incidents/:id/status` update status and downtime info
- `POST /incidents/:id/comments` add comments or progress updates
- Email/password auth with HttpOnly JWT cookies and role-based access
- User administration for admin-created users
- Machine registry with machine/area/line context on incidents
- Immutable incident event timeline at `/incidents/:id/events`
- Incident dashboard metrics at `/incidents/metrics`
- Prometheus metrics at `/metrics`
- Redis-backed background job placeholders for critical incident notifications,
  stale incident scanning, and daily summaries
- Swagger UI at `/docs`
- Next.js dashboard in `frontend/`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

For e2e tests, also create a dedicated test environment file:

```powershell
Copy-Item .env.test.example .env.test
```

3. Start PostgreSQL with Docker:

```bash
npm run db:up
```

This also starts Redis for local background jobs.

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Apply the existing database migrations:

```bash
npx prisma migrate deploy
```

6. Seed local sample data:

```bash
npm run prisma:seed
```

Seeded demo users all use the password `ChangeMe12345!`. Start with
`admin@example.com`.

7. Start the API:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/docs`.

8. Install and start the frontend:

```bash
npm ci --prefix frontend
npm run dev --prefix frontend -- --port 3001
```

The frontend will be available at `http://localhost:3001` and calls the API at
`http://localhost:3000` by default. To change the browser-facing API URL, create
`frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

The API allows `http://localhost:3001` by default. Override that with
`FRONTEND_ORIGIN` in `.env` when the frontend runs elsewhere.

The frontend dev script uses Next.js Webpack mode by default to avoid a
Turbopack/PostCSS worker process explosion seen on this Windows setup. Use
`npm run dev:turbo --prefix frontend -- --port 3001` only when intentionally
re-testing Turbopack after dependency or Node upgrades.

## Useful commands

```bash
npm run dev:all
npm run dev:api
npm run dev:web
npm run verify
npm run build
npm run typecheck
npm run lint
npm run lint:fix
npm run format:check
npm run test
npm run test:e2e
npm run test:browser
npm run test:e2e:setup
npm run prisma:seed
npm run prisma:studio
npm run db:down
npm run lint --prefix frontend
npm run build --prefix frontend
```

`npm run test:e2e` prepares and resets the dedicated `incident_tracker_test` database before running the suite, so it does not touch local development data.

The seed and e2e setup commands include local database safety checks before deleting data.

## Production deployment

Copy `.env.production.example` to `.env.production`, replace every secret, and
follow [the VPS deployment runbook](docs/deployment.md). The production compose
file runs Postgres, Redis, the API, the frontend, and a one-shot migration
service.

## Example request

```powershell
curl -X POST http://localhost:3000/incidents `
  -H "Content-Type: application/json" `
  -d "{\"title\":\"Hydraulic leak on press 04\",\"machineId\":\"PRESS-04\",\"priority\":\"HIGH\",\"description\":\"Oil leak detected near the main cylinder.\"}"
```

List incidents with filters and pagination:

```powershell
curl "http://localhost:3000/incidents?status=OPEN&page=1&pageSize=20"
```

`GET /incidents` returns a paginated response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "itemCount": 0,
    "pageCount": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```
