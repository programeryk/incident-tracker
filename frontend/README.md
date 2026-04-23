# Incident Tracker Frontend

Next.js dashboard for the Maintenance Incident Tracker API.

## Local setup

Install frontend dependencies from the repository root:

```bash
npm ci --prefix frontend
```

Create `frontend/.env.local` when you need to override the API URL:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Start the backend API on `http://localhost:3000`, then run the frontend on
`http://localhost:3001`:

```bash
npm run dev --prefix frontend -- --port 3001
```

After seeding, sign in with `admin@example.com` and `ChangeMe12345!`.

The default dev script uses Next.js Webpack mode because Turbopack currently
spawns runaway PostCSS worker processes on this Windows setup. To re-test
Turbopack after upgrading Next.js or Node, use:

```bash
npm run dev:turbo --prefix frontend -- --port 3001
```

## Verify

```bash
npm run lint --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
```

## Expected app flow

- List, filter, paginate, and open incident detail pages.
- Create incidents from the dashboard.
- Update status from a detail page using valid lifecycle transitions.
- Add progress comments from a detail page.
- Sign in/out with the authenticated operations shell.
- Manage machines as a supervisor/admin.
- Manage users as an admin.
- Review incident timeline events and dashboard metrics.
