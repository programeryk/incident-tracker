# Maintenance Incident Tracker API

Backend API for reporting and managing machine incidents with NestJS, PostgreSQL, Prisma, validation, Docker, and Swagger.

## Stack

- NestJS
- PostgreSQL
- Prisma ORM
- class-validator and class-transformer
- Swagger/OpenAPI
- Docker Compose
- Jest for unit and e2e tests

## What is included

- `GET /` health check
- `POST /incidents` create an incident
- `GET /incidents` filter by machine, status, priority, and date range
- `GET /incidents/:id` fetch a single incident with comments
- `PATCH /incidents/:id/status` update status and downtime info
- `POST /incidents/:id/comments` add comments or progress updates
- Swagger UI at `/docs`

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

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Create the initial database migration:

```bash
npm run prisma:migrate -- --name init
```

6. Seed local sample data:

```bash
npm run prisma:seed
```

7. Start the API:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/docs`.

## Useful commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npm run test:e2e:setup
npm run prisma:seed
npm run prisma:studio
npm run db:down
```

`npm run test:e2e` prepares and resets the dedicated `incident_tracker_test` database before running the suite, so it does not touch local development data.

## Next features

- Authentication and role-based access
- Pagination and sorting on incident queries
- Redis-backed caching or queues
- Structured logging and metrics
- Seed data for demo environments
- More tests around incident lifecycle flows

## Example request

```powershell
curl -X POST http://localhost:3000/incidents `
  -H "Content-Type: application/json" `
  -d "{\"title\":\"Hydraulic leak on press 04\",\"machineId\":\"PRESS-04\",\"priority\":\"HIGH\",\"description\":\"Oil leak detected near the main cylinder.\"}"
```
