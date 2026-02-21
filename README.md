# UKRFISH Frontend (Next.js)

## Run locally

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`
   - app will run on `http://localhost:3001`

## Scripts

- `npm run dev` - Next.js dev server on port `3001`.
- `npm run build` - production build.
- `npm run start` - start production server on port `3001`.
- `npm run lint` - eslint check.

## Environment variables

- `NEXT_PUBLIC_WP_API_BASE_URL` - WordPress REST API base URL.
- `PORT` - app port (`3001` by default).
- `DATABASE_URL` - PostgreSQL connection string.
- `AUTH_SECRET` - secret for Auth.js sessions/cookies.
- `AUTH_TRUST_HOST` - set `true` behind proxies/local reverse proxy.

## Migration note

The project now runs on Next.js app router. Existing section behavior and URLs are preserved through a catch-all route that renders the current SPA shell.

## Membership module

- Membership logic now lives in-app (plan matrix + gated feature access + member cabinet).
- WordPress is used for content management only (news/pages via REST API).

## Auth + DB setup

1. Ensure PostgreSQL is running and `DATABASE_URL` points to your DB.
2. Generate Prisma client:
   - `npm run prisma:generate`
3. Create/apply migrations:
   - `npm run prisma:migrate -- --name init_membership_auth`
4. Seed plans/features:
   - `npm run prisma:seed`

## New API endpoints

- `POST /api/auth/register`
  - body: `{ name, email, password, organizationName? }`
- `POST /api/auth/[...nextauth]`
  - Auth.js sign-in/sign-out/session endpoints.
- `POST /api/membership/apply`
  - body: `{ planCode: "start" | "professional" | "investor", billingCycle?, organizationId? }`
  - requires auth.
- `GET /api/me/membership`
  - returns current membership + feature list.
  - requires auth.

## Auth pages

- `GET /auth/signin` - credentials sign-in form.
- `GET /auth/signup` - registration form (auto sign-in after successful registration).
- `GET /auth/join` - simple membership signup that issues a temporary password.
- `GET /membership/apply` - full membership application form (requires login).

## Admin panel

- `GET /admin/users` - manage users and global roles (`USER`, `ADMIN`, `SUPERADMIN`).
- `GET /admin/memberships` - review membership records and change status/plan.

Access guard:

- User must have role `ADMIN` or `SUPERADMIN`.
- Bootstrap admin emails can be specified via `ADMIN_EMAILS` env var (comma-separated).
- On first visit, bootstrap email with role `USER` is auto-promoted to `ADMIN`.

### Create first admin user

If you cannot log in to `/admin/*` yet, create an admin user directly:

- `npm run admin:create -- --email admin@ukrfish.org --password "StrongPass123!" --role SUPERADMIN`

You can also pass values through env vars:

- `ADMIN_EMAIL=admin@ukrfish.org ADMIN_PASSWORD="StrongPass123!" ADMIN_ROLE=SUPERADMIN npm run admin:create`
