# API Route Plan

Base path: `/api/v1`

Status of every endpoint, and the order the remaining ones should be built in.
The ordering is by dependency, not by importance — each phase unblocks the next.

**18 routes done · 40 remaining · 58 total**

---

## Legend

| Guard      | Meaning                                                   |
| ---------- | --------------------------------------------------------- |
| —          | Public                                                    |
| `auth`     | `authenticate` — valid access token, active account       |
| `super`    | `authenticate` + `requireSuperAdmin`                      |
| `ctx:PERM` | `setOrgId` → `getAuthContext` → `requirePermission(PERM)` |

Org-scoped routes always compose in that order:

```ts
validateParams(organizationIdParamSchema); // the id is a real UUID
setOrgId; // pin it on the request
getAuthContext; // membership + role + permissions
requirePermission(PERMISSIONS.ROLE_READ); // the one permission this needs
```

---

## Done

### Health

- [x] `GET /health` — —

### Auth — `src/modules/auth/auth.routes.ts`

- [x] `POST /auth/register` — — · registerLimiter
- [x] `POST /auth/login` — — · authLimiter
- [x] `POST /auth/refresh` — — · authLimiter, rotates the session
- [x] `POST /auth/logout` — — · revokes one session
- [x] `POST /auth/logout-all` — `auth`
- [x] `GET /auth/me` — `auth`
- [x] `POST /auth/email/verification-request` — `auth` · otpLimiter
- [x] `POST /auth/email/verify` — `auth` · otpLimiter

### Organizations — `src/modules/organizations/organizations.route.ts`

- [x] `POST /organizations` — `auth` · creator becomes OWNER
- [x] `GET /organizations` — `auth` · caller's own memberships
- [x] `GET /organizations/admin` — `super` · every organization
- [x] `PATCH /organizations/:orgId/status` — `super` · ACTIVE / SUSPENDED
- [x] `GET /organizations/:orgId` — `ctx:ORGANIZATION:READ`

### System roles — `src/modules/roles/roles.routes.ts`

- [x] `POST /system-roles` — `super`
- [x] `POST /system-roles/:roleId/permissions` — `super`

### Permissions — `src/modules/permissions/permissions.routes.ts`

- [x] `POST /permissions` — `super`
- [x] `GET /permissions` — `auth`

---

## Phase 0 — Bootstrap

**Nothing else can be exercised until this exists.** The database currently has
zero users, roles and permissions, so every org-scoped route 403s and every
super-admin route is unreachable. Build this first, in this order.

- [ ] **Seed script** (`npm run db:seed`) — insert all 12 catalogue permissions,
      then the system roles `OWNER` / `ADMIN` / `MEMBER`, then their
      `role_permissions`. Must be idempotent (`ON CONFLICT DO NOTHING`) so it can
      run on every deploy.
- [ ] **Promote-super-admin script** (`npm run grant:super -- <email>`) —
      replaces the manual `UPDATE users SET is_super_admin` in the README.
- [x] `GET /system-roles` — `super` · list, needed to verify the seed landed
- [x] `GET /system-roles/:roleId/permissions` — `super`
- [x] `DELETE /system-roles/:roleId/permissions/:permissionName` — `super` ·
      the assign route has no inverse today

Decide here and write it down: **`OWNER` is the role `createOrganization` looks
up by name.** If the seed does not create it, org creation 500s.

---

## Phase 1 — Organization lifecycle

Small, self-contained, and closes the CRUD gap on a resource that already has
its permissions defined.

- [x] `PATCH /organizations/:orgId` — `ctx:ORGANIZATION:UPDATE` · name, slug
- [x] `DELETE /organizations/:orgId` — `ctx:ORGANIZATION:DELETE` · soft delete
      (`deleted_at`), and revoke every membership's sessions

---

## Phase 2 — Organization-scoped roles

**Blocks phases 3 and 4** — you cannot invite someone or change a member's role
until an organization can define roles of its own.

Mount at `/organizations/:orgId/roles` with `Router({ mergeParams: true })`, so
`setOrgId` still sees `req.params.orgId`.

- [x] `POST /organizations/:orgId/roles` — `ctx:ROLE:CREATE`
- [x] `GET /organizations/:orgId/roles` — `ctx:ROLE:READ` · must return system
      roles alongside the org's own, since memberships can point at either
- [ ] `GET /organizations/:orgId/roles/:roleId` — `ctx:ROLE:READ`
- [ ] `PATCH /organizations/:orgId/roles/:roleId` — `ctx:ROLE:UPDATE`
- [ ] `DELETE /organizations/:orgId/roles/:roleId` — `ctx:ROLE:DELETE`
- [ ] `GET /organizations/:orgId/roles/:roleId/permissions` — `ctx:ROLE:READ`
- [ ] `PUT /organizations/:orgId/roles/:roleId/permissions` — `ctx:ROLE:UPDATE` ·
      replace the whole set in one transaction; simpler for clients than
      add/remove pairs

Guard rails these routes need:

- A role belonging to another organization must 404, never 403 — the org id in
  the path is not enough on its own, check `roles.organization_id = orgId`.
- System roles are read-only here. `assignPermission` already refuses them
  ([roles.service.ts:29-35](src/modules/roles/roles.service.ts#L29-L35)); the
  update and delete routes need the same check.
- Delete must fail while any membership still points at the role —
  `memberships.role_id` is `ON DELETE RESTRICT`, so an unhandled attempt
  surfaces as a 500. Catch it and return 409.
- No caller may grant a permission they do not themselves hold, or they can
  escalate to owner through a role they create.

---

## Phase 3 — Members

Roles exist now, so memberships can be moved between them.

Mount at `/organizations/:orgId/members`.

- [ ] `GET /organizations/:orgId/members` — `ctx:MEMBERSHIP:READ` · paginated
- [ ] `GET /organizations/:orgId/members/:membershipId` — `ctx:MEMBERSHIP:READ`
- [ ] `PATCH /organizations/:orgId/members/:membershipId/role` — `ctx:MEMBERSHIP:UPDATE`
- [ ] `PATCH /organizations/:orgId/members/:membershipId/status` — `ctx:MEMBERSHIP:UPDATE` ·
      ACTIVE / SUSPENDED
- [ ] `DELETE /organizations/:orgId/members/:membershipId` — `ctx:MEMBERSHIP:DELETE` ·
      status `REMOVED`, not a row delete
- [ ] `DELETE /organizations/:orgId/members/me` — `auth` + membership only ·
      leave the organization, no permission required

**The last-owner invariant belongs here.** Demoting, suspending, removing, or
leaving must all refuse when the target is the last ACTIVE member holding
`ORGANIZATION:DELETE`. One shared service check, called from all five routes —
written once, or it will be missed in at least one of them.

Suspending or removing a member must also revoke their sessions, otherwise
their access token keeps working against the org until it expires. The denylist
in `src/lib/accessTokenDenylist.ts` is already wired for this.

---

## Phase 4 — Invitations

The `invitations` table has been sitting unused since migration 007. This is the
only way a second person joins an organization, so it is the phase that makes
the product multi-user.

### Org-side (managing invitations)

- [ ] `POST /organizations/:orgId/invitations` — `ctx:MEMBERSHIP:CREATE` ·
      emails a token, stores only `token_hash`
- [ ] `GET /organizations/:orgId/invitations` — `ctx:MEMBERSHIP:READ`
- [ ] `POST /organizations/:orgId/invitations/:invitationId/resend` — `ctx:MEMBERSHIP:CREATE` ·
      new token, new expiry
- [ ] `DELETE /organizations/:orgId/invitations/:invitationId` — `ctx:MEMBERSHIP:CREATE` ·
      status `REVOKED`

### Invitee-side (`/invitations`, no org context — the invitee is not a member yet)

- [ ] `GET /invitations/:token` — — · preview: org name and role only. Leak
      nothing else; the token is the only credential.
- [ ] `POST /invitations/:token/accept` — `auth` · creates the membership
- [ ] `POST /invitations/:token/decline` — `auth` · status `REJECTED`

Decisions to settle before writing this:

- **Permission naming.** The catalogue has no `INVITATION` resource. Either
  invitations ride on `MEMBERSHIP:*` (simplest, assumed above) or you add
  `INVITATION:*` to the catalogue plus a migration widening the
  `permissions_resource_check` constraint. Pick one and be consistent.
- **Accept requires a verified, authenticated user** — the membership needs a
  `user_id`. An invitee with no account registers first, then accepts. The email
  should link to a register page carrying the token.
- **Email match.** Decide whether the accepting account's email must equal
  `invitations.email`. If not, a leaked token is a free membership.
- Hash tokens with `hashToken` from `src/lib/token.ts`, exactly like refresh
  tokens. Never store the raw value.
- Expiry is not enforced by the database. Check `expires_at` on read and flip
  the status to `EXPIRED`.

---

## Phase 5 — Sessions and account self-service

Everything here is per-user and independent of organizations, so it can slot in
earlier if you want it sooner.

### Sessions — `/sessions`

- [ ] `GET /sessions` — `auth` · the caller's active sessions, current one
      flagged via `req.sessionId`
- [ ] `DELETE /sessions/:sessionId` — `auth` · revoke one, ownership-checked

`sessions.device_name` is never written. Either populate it from the user-agent
on login or drop the column.

### Account — `/users`

- [ ] `PATCH /users/me` — `auth` · display name
- [ ] `POST /users/me/password` — `auth` · requires current password; revoke all
      other sessions on success
- [ ] `DELETE /users/me` — `auth` · soft delete, revoke everything

### Password reset — `/auth`

- [ ] `POST /auth/password/forgot` — — · otpLimiter. Always return 200, whether
      or not the email exists, or this becomes an account-enumeration oracle.
- [ ] `POST /auth/password/reset` — — · token + new password; revoke all sessions

There is no `password_resets` table. Use Redis with a TTL, the same shape as the
email OTP in `auth.service.ts` — no migration needed.

---

## Phase 6 — Audit log

The table has existed since migration 009 and nothing has ever written to it.

- [ ] **Audit writer service** — prerequisite, not a route. A single
      `recordAudit()` called from the services that mutate state: org create /
      update / status, role and permission changes, member role and status
      changes, invitation lifecycle, login and logout. Write it inside the
      caller's transaction where one exists, so an audit row cannot survive a
      rolled-back change.
- [ ] `GET /organizations/:orgId/audit-logs` — `ctx:AUDIT:READ` · filter by
      actor, resource, date range; paginated
- [ ] `GET /admin/audit-logs` — `super` · cross-organization

Backfill is impossible, so the longer this waits the bigger the hole in the
record.

---

## Phase 7 — Super-admin console

Platform operations. Last because nothing else depends on it — the Phase 0
scripts already cover what is strictly needed to run the system.

- [ ] `GET /admin/users` — `super` · paginated, searchable
- [ ] `GET /admin/users/:userId` — `super` · with memberships
- [ ] `PATCH /admin/users/:userId/status` — `super` · ACTIVE / SUSPENDED / LOCKED
- [ ] `PATCH /admin/users/:userId/super-admin` — `super` · grant and revoke;
      must refuse to remove the last super admin
- [ ] `DELETE /admin/users/:userId/sessions` — `super` · force logout
- [ ] `DELETE /permissions/:permissionId` — `super` · completes the permissions
      resource

---

## Conventions to keep

**Route order matters.** Express matches in registration order, so every static
segment must be registered above the parameterised one. `/organizations/admin`
sits above `/organizations/:orgId` today — new static routes go with it, not
after it.

**Nested routers need `mergeParams: true`,** or `req.params.orgId` is empty and
`setOrgId` throws a 500.

**Non-members get 403, never 404.** `loadAuthContext` already does this so the
API cannot be used to probe which organization ids exist. Sub-resources must
match: a role or member belonging to another org is a 404 _after_ the org-level
403, never a distinguishable error before it.

**Every mutation gets an audit row** once Phase 6 lands. Add the call in the
same commit as the route, not in a sweep afterwards.

**Pagination on every list route** — `GET /permissions` and
`GET /organizations/admin` currently return unbounded result sets and should be
retrofitted when the shared helper exists.

---

## Not on the list, but blocking a real deployment

- No tests, of any kind, anywhere.
- No linter or formatter config.
- `JWT_EXPIRES_IN=1h` is long for an access token, and it doubles as the
  revocation-denylist TTL. `15m` is the better default.
