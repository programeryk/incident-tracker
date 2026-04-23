# VPS Deployment Runbook

## First Deploy

1. Provision a Linux VPS with Docker and the Docker Compose plugin.
2. Copy the repository to the server.
3. Copy `.env.production.example` to `.env.production` and replace every secret.
4. Point `FRONTEND_ORIGIN` at the public web origin and `NEXT_PUBLIC_API_BASE_URL` at the public API origin.
5. Start the stack:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

The `migrate` service runs `prisma migrate deploy` before the API starts. If
`INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` are set, the API creates the
first admin account on startup.

## Updates

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml ps
```

## Logs

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

## Backup

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > incident_tracker_backup.sql
```

## Restore

Stop the API before restoring, then run:

```bash
cat incident_tracker_backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## Rollback

Check out the previous commit or image tag and run the update command again.
Do not roll back database migrations unless you have a tested restore point.
