# IAM-backend

Multi-tenant identity and access management API: users, organizations, roles,
permissions and sessions.

Express 5 · TypeScript · PostgreSQL (Kysely) · Redis · Zod · Pino

## Requirements

- Node.js 20+
- PostgreSQL 13+
- Redis 6+ (required, not optional — it holds rate-limit counters, email OTPs
  and the access-token revocation denylist)
- An SMTP account for verification email

## Setup

```bash
npm install
cp .env.example .env   # then fill in JWT_SECRET, DATABASE_URL, REDIS_URL, SMTP_*
npm run migrate
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Watch-mode server via tsx |
| `npm run build` | Type-check and emit to `dist/` |
| `npm start` | Run the built server |
| `npm run migrate` | Apply pending SQL migrations in `src/database/migrations` |
| `npm run db:clear` | Truncate every table (refuses to run when `NODE_ENV=production`) |

## Layout

```
src/
  app.ts, server.ts        Express wiring and process lifecycle
  config/                  Environment parsing, mailer transport
  database/                Kysely instance, table types, SQL migrations
  errors/                  RequestError hierarchy and the error handler
  lib/                     JWT, tokens, Redis, logging, validation helpers
  middlewares/             authenticate, permission guards, rate limiting
  modules/<name>/          routes -> controller -> service -> repo per domain
```

Each module keeps the same seam: routes validate and guard, controllers shape
HTTP, services hold rules, repos own SQL. Nothing skips a layer.

## Authorization model

Permissions are `RESOURCE:ACTION` strings defined once in
`src/modules/permissions/permission.catalogue.ts`. That catalogue is the single
source of truth — every write to `permissions.name` and every route guard reads
from it, so stored names cannot drift from the names the guards check.

An org-scoped route composes four middlewares in order:

```ts
authenticate                              // who is calling
validateParams(organizationIdParamSchema) // the org id is a real UUID
setOrgId                                  // pin it on the request
getAuthContext                            // load membership, role, permissions
requirePermission(PERMISSIONS.ROLE_READ)  // assert the one permission needed
```

A non-member gets 403, never 404, so the response cannot be used to probe which
organization ids exist.

Super admins are a **platform** role. They monitor organizations and define the
system role and permission catalogue. They hold no implicit power inside an
organization: in org scope they are an ordinary member bound by their own
membership role.

## Sessions

Login issues a short-lived access token plus a refresh token stored as a
SHA-256 hash. Refreshing rotates the pair inside one transaction and keeps a
`family_id`; presenting an already-rotated token is treated as theft and revokes
the whole family.

Access tokens carry the session id, and revocation writes that id to a Redis
denylist for the token's remaining lifetime — so logout takes effect
immediately rather than after the token expires.

## Bootstrapping

`is_super_admin` defaults to false and no endpoint grants it. Promote the first
account by hand after registering it:

```sql
UPDATE users SET is_super_admin = TRUE WHERE id = '<user-uuid>';
```

That account can then create the system roles and permissions the rest of the
API depends on.

## Status

Auth, organizations, roles, permissions and sessions are implemented. The
`members`, `invitations`, `sessions` and `users` routers are registered but
still empty, and nothing writes to `audit_logs` yet. There are no tests.
