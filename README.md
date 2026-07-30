# Employee Management System — Backend

REST API for an employee management system with two roles: **MANAGER** (full access) and **EMPLOYEE** (read-only access to their own records).

Built with **Node.js · Express · PostgreSQL · Prisma · JWT · bcrypt**, in a layered MVC architecture.

## Live API

**https://employee-management-api-w51q.onrender.com/api**

```bash
curl https://employee-management-api-w51q.onrender.com/api/health
```

Hosted on Render's free tier with a Neon PostgreSQL database. The instance spins down after 15 minutes of inactivity, so the first request may take 30–60 seconds while it wakes; subsequent requests are fast.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Default accounts](#default-accounts)
- [Architecture](#architecture)
- [Authentication & authorization](#authentication--authorization)
- [Response format](#response-format)
- [API reference](#api-reference)
- [Error handling](#error-handling)
- [Production notes](#production-notes)
- [Deployment](#deployment)

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 18+ (ES modules) |
| Framework | Express 4 |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Validation | Zod |
| Security | helmet, cors |
| Logging | morgan |

---

## Project structure

```
.
├── prisma/
│   ├── migrations/            # Versioned SQL migrations
│   ├── schema.prisma          # Data model
│   └── seed.js                # Manager + 2 employee accounts
├── src/
│   ├── config/
│   │   ├── env.js             # Validated environment configuration
│   │   └── prisma.js          # Prisma client singleton
│   ├── controllers/           # HTTP layer — thin, no business logic
│   ├── middleware/
│   │   ├── authenticate.js    # authenticateUser — verifies the JWT
│   │   ├── authorize.js       # authorizeRoles(...) — role gate
│   │   ├── validate.js        # Zod request validation
│   │   └── errorHandler.js    # Centralized error handling + 404
│   ├── routes/                # Route definitions, one file per module
│   ├── services/              # Business logic + database access
│   ├── utils/
│   │   ├── ApiError.js        # Operational error with a status code
│   │   ├── apiResponse.js     # Response envelope + pagination meta
│   │   ├── asyncHandler.js    # Async route wrapper
│   │   ├── jwt.js             # Token signing / verification
│   │   ├── password.js        # bcrypt hashing
│   │   └── serializers.js     # Prisma record → API-safe JSON
│   ├── validators/            # Zod schemas, one file per module
│   ├── app.js                 # Express app assembly
│   └── server.js              # Process entry point + graceful shutdown
├── .env.example
└── package.json
```

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- A running PostgreSQL instance

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum `DATABASE_URL` and `JWT_SECRET`.

Generate a strong secret with:

```bash
openssl rand -base64 48
```

### 3. Create the database

```bash
createdb employee_management
```

...or via `psql`:

```sql
CREATE DATABASE employee_management;
```

### 4. Run migrations

```bash
npm run prisma:migrate      # development — applies and tracks migrations
```

In production, apply the committed migrations without generating new ones:

```bash
npm run prisma:deploy
```

### 5. Seed the default accounts

```bash
npm run seed
```

### 6. Start the server

```bash
npm run dev     # watch mode
npm start       # production
```

The API is served at `http://localhost:5000/api`.

Verify it is up:

```bash
curl http://localhost:5000/api/health
```

### Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start with file watching |
| `npm start` | Start the server |
| `npm run prisma:migrate` | Create and apply a migration (development) |
| `npm run prisma:deploy` | Apply pending migrations (production) |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run seed` | Create the default manager and employee accounts |

---

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development` or `production` |
| `PORT` | no | `5000` | HTTP port |
| `DATABASE_URL` | **yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **yes** | — | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | no | `1d` | Token lifetime |
| `BCRYPT_SALT_ROUNDS` | no | `10` | bcrypt cost factor |
| `CORS_ORIGIN` | no | `*` | `*` or a comma-separated origin list |

Missing required variables cause the process to exit at boot with a clear message rather than failing on the first request.

---

## Database

### Models

**User** — one table for both roles; access is separated by `role`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `name` | String | |
| `email` | String | Unique, stored lowercase |
| `password` | String | bcrypt hash — never returned by the API |
| `role` | `MANAGER` \| `EMPLOYEE` | Default `EMPLOYEE` |
| `department` | String? | |
| `salary` | Decimal(12,2)? | Decimal, not Float, to avoid money rounding errors |
| `status` | `ACTIVE` \| `INACTIVE` | Inactive users cannot log in |
| `createdAt` / `updatedAt` | DateTime | |

**Task** — `id`, `title`, `description?`, `assignedTo`, `assignedBy`, `dueDate?`, `status` (`PENDING` \| `IN_PROGRESS` \| `COMPLETED`), timestamps.

**Project** — `id`, `name`, `description?`, `employeeId`, `status` (`NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` \| `ON_HOLD`), timestamps.

**Schedule** — `id`, `employeeId`, `date` (date only), `startTime`, `endTime` (`HH:mm` strings), `description?`, timestamps.

**Leave** — `id`, `employeeId`, `fromDate`, `toDate` (date only), `reason`, `status` (`PENDING` \| `APPROVED` \| `REJECTED`), timestamps.

### Design notes

- **Salary is `Decimal`**, not `Float` — floating point cannot represent money exactly.
- **Schedule times are `HH:mm` strings**, so an entry renders exactly as the manager typed it regardless of the viewer's timezone.
- **Date-only columns** (`date`, `fromDate`, `toDate`) use `@db.Date` and are normalized to UTC midnight on input, then returned as `YYYY-MM-DD`.
- **Deleting a user cascades** to their tasks, projects, schedules and leaves.
- Indexes cover every column the API filters on (`role`, `status`, `assignedTo`, `employeeId`, `date`).

---

## Default accounts

`npm run seed` creates exactly these three accounts and no other data:

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Manager | Manager | `manager@gmail.com` | `manager@123` |
| Employee | Razina Khan | `razinakhan844@gmail.com` | `razina@123` |
| Employee | Mahek | `mahek@gmail.com` | `mahek@123` |

No tasks, projects, schedules or leaves are seeded — create those through the API once you are logged in.

> These are development credentials. Change them before any real deployment.

The seed is idempotent: users are upserted by email, so re-running it never creates duplicates. Existing accounts keep their current password — delete the user first if you need to reset one.

---

## Architecture

Requests flow through clearly separated layers:

```
Route  →  authenticateUser  →  authorizeRoles  →  validate  →  Controller  →  Service  →  Prisma
                                                                                  ↓
                                                                            errorHandler
```

| Layer | Responsibility |
| --- | --- |
| **Routes** | URL structure and middleware composition. No logic. |
| **Middleware** | Cross-cutting concerns: auth, roles, validation, errors. |
| **Validators** | Zod schemas. Coerce, trim and strip unknown keys before anything else runs. |
| **Controllers** | Translate HTTP to service calls and back. No database access. |
| **Services** | Business rules and all Prisma queries. Throw `ApiError` for expected failures. |
| **Utils** | Shared primitives — errors, responses, hashing, tokens, serialization. |

Two rules keep the layering honest:

1. Controllers never touch Prisma.
2. Services never touch `req` or `res`.

---

## Authentication & authorization

### Login

`POST /api/auth/login` is the only public endpoint besides `/api/health`. It returns a signed JWT.

Send the token on every other request:

```
Authorization: Bearer <token>
```

### `authenticateUser`

Verifies the token and **re-loads the user from the database** on every request. The token payload carries only `sub` (user id) and `role`; everything else is read fresh. This means deactivating or deleting a user revokes their access immediately, rather than at token expiry.

### `authorizeRoles(...roles)`

Gates a route to specific roles. Applied at the router level so no route can accidentally be left open:

```js
router.use(authenticateUser, authorizeRoles('MANAGER'));       // manager-only module
router.use(authenticateUser, authorizeRoles('MANAGER', 'EMPLOYEE')); // /me module
```

### How employee isolation is enforced

Employees can only read their own data because **`/api/me/*` handlers resolve the target id from `req.user.id`, never from client input**. There is no path under `/me` that accepts an employee id, so there is no parameter to tamper with. Every endpoint that does take an employee id lives under a manager-only router.

Password hashes are stripped in `serializers.js` by destructuring the field away, so a hash cannot leak through a forgotten `select`.

### Access matrix

| Capability | Manager | Employee |
| --- | :---: | :---: |
| Login | ✅ | ✅ |
| View own profile / salary | ✅ | ✅ |
| View own tasks / projects / schedule / leave | ✅ | ✅ |
| View all employees | ✅ | ❌ |
| View any employee profile | ✅ | ❌ |
| Create / update / delete employee | ✅ | ❌ |
| Set or update salary | ✅ | ❌ |
| Create, assign, update, delete tasks | ✅ | ❌ |
| Create, assign, update, delete projects | ✅ | ❌ |
| Create, update, delete schedules | ✅ | ❌ |
| Create leave records | ✅ | ❌ |
| Approve / reject leave | ✅ | ❌ |

An employee hitting a manager-only route receives `403`.

---

## Response format

Every endpoint returns the same envelope.

**Success**

```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

`meta` is present only on paginated endpoints.

**Failure**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "A valid email address is required" }
  ]
}
```

`errors` is present only for field-level validation failures. Stack traces are included outside production only.

---

## API reference

Base URL: `http://localhost:5000/api`

All endpoints except `/health` and `/auth/login` require `Authorization: Bearer <token>`.

### Health

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/health` | Public |

### Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/auth/login` | Public |

```jsonc
// POST /api/auth/login
{ "email": "manager@company.com", "password": "Manager@123" }
```

```jsonc
// 200 OK
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": {
      "id": "…", "name": "System Manager", "email": "manager@company.com",
      "role": "MANAGER", "department": "Management", "salary": null,
      "status": "ACTIVE", "createdAt": "…", "updatedAt": "…"
    },
    "role": "MANAGER"
  }
}
```

### Self-service — Manager + Employee

All of these return **only the authenticated user's own data**.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/me` | Own profile |
| `GET` | `/me/salary` | Own salary |
| `GET` | `/me/tasks` | Tasks assigned to me |
| `GET` | `/me/projects` | Projects assigned to me |
| `GET` | `/me/schedules` | My schedule |
| `GET` | `/me/leaves` | My leave records |

Query parameters: `page`, `limit`, and `status` (or `from` / `to` for schedules).

### Employees — Manager only

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/employees` | Paginated list |
| `GET` | `/employees/:id` | Employee profile |
| `POST` | `/employees` | Add an employee |
| `PUT` | `/employees/:id` | Update details |
| `DELETE` | `/employees/:id` | Delete an employee |
| `GET` | `/employees/:id/salary` | Salary card |
| `PATCH` | `/employees/:id/salary` | Set or update salary |
| `GET` | `/employees/:id/tasks` | That employee's tasks |
| `GET` | `/employees/:id/projects` | That employee's projects |
| `GET` | `/employees/:id/schedules` | That employee's schedule |
| `GET` | `/employees/:id/leaves` | That employee's leave records |

`GET /employees` query parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `page` | `1` | Page number |
| `limit` | `10` | Page size, max `100` |
| `search` | — | Partial, case-insensitive match on name or email |
| `department` | — | Exact department, case-insensitive |
| `role` | — | `MANAGER` \| `EMPLOYEE` |
| `status` | — | `ACTIVE` \| `INACTIVE` |
| `sortBy` | `createdAt` | `name` \| `email` \| `department` \| `salary` \| `createdAt` |
| `sortOrder` | `desc` | `asc` \| `desc` |

```jsonc
// POST /api/employees
{
  "name": "Ayesha Khan",
  "email": "ayesha@company.com",
  "password": "Employee@123",
  "role": "EMPLOYEE",         // optional, defaults to EMPLOYEE
  "department": "Engineering", // optional
  "salary": 95000,             // optional
  "status": "ACTIVE"           // optional, defaults to ACTIVE
}
```

```jsonc
// PATCH /api/employees/:id/salary
{ "salary": 105000 }
```

### Tasks — Manager only

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/tasks` | All tasks — `page`, `limit`, `status`, `assignedTo`, `search` |
| `POST` | `/tasks` | Create and assign |
| `PUT` | `/tasks/:id` | Update |
| `DELETE` | `/tasks/:id` | Delete |

```jsonc
// POST /api/tasks   — assignedBy is taken from the session, not the body
{
  "title": "Build authentication module",
  "description": "Implement JWT login and role-based route protection.",
  "assignedTo": "<employee-uuid>",
  "dueDate": "2026-08-15",     // optional
  "status": "PENDING"          // optional
}
```

### Projects — Manager only

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/projects` | All projects — `page`, `limit`, `status`, `employeeId`, `search` |
| `POST` | `/projects` | Create and assign |
| `PUT` | `/projects/:id` | Update |
| `DELETE` | `/projects/:id` | Delete |

```jsonc
// POST /api/projects
{
  "name": "Employee Management System",
  "description": "Internal HR platform.",
  "employeeId": "<employee-uuid>",
  "status": "NOT_STARTED"      // optional
}
```

### Schedules — Manager only

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/schedules` | All entries — `page`, `limit`, `employeeId`, `from`, `to` |
| `POST` | `/schedules` | Create |
| `PUT` | `/schedules/:id` | Update |
| `DELETE` | `/schedules/:id` | Delete |

```jsonc
// POST /api/schedules
{
  "employeeId": "<employee-uuid>",
  "date": "2026-08-01",
  "startTime": "09:00",        // HH:mm, 24-hour
  "endTime": "17:00",          // must be later than startTime
  "description": "Regular shift" // optional
}
```

### Leave — Manager only

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/leaves` | All records — `page`, `limit`, `status`, `employeeId` |
| `POST` | `/leaves` | Create a leave record |
| `PATCH` | `/leaves/:id/approve` | Approve a pending request |
| `PATCH` | `/leaves/:id/reject` | Reject a pending request |

```jsonc
// POST /api/leaves
{
  "employeeId": "<employee-uuid>",
  "fromDate": "2026-08-10",
  "toDate": "2026-08-12",      // may equal fromDate, never earlier
  "reason": "Family event",
  "status": "PENDING"          // optional
}
```

A decision is final — approving or rejecting an already-decided request returns `409`, so a second manager cannot silently overturn the first one's call.

### Quick walkthrough

```bash
BASE=http://localhost:5000/api

# 1. Log in as the manager
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"manager@company.com","password":"Manager@123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])')

# 2. List employees
curl -s $BASE/employees?page=1\&limit=5 -H "Authorization: Bearer $TOKEN"

# 3. Log in as an employee and read their own data
EMP=$(curl -s -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ayesha@company.com","password":"Employee@123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])')

curl -s $BASE/me/tasks -H "Authorization: Bearer $EMP"

# 4. The same employee is blocked from a manager route → 403
curl -s $BASE/employees -H "Authorization: Bearer $EMP"
```

---

## Error handling

All errors converge on `middleware/errorHandler.js`. Async controllers are wrapped in `asyncHandler`, so a rejected promise is forwarded to Express instead of crashing the process.

| Status | Meaning | Typical cause |
| --- | --- | --- |
| `400` | Bad Request | Malformed JSON, deleting your own account |
| `401` | Unauthorized | Missing, invalid or expired token; wrong credentials |
| `403` | Forbidden | Wrong role, or an inactive account |
| `404` | Not Found | Unknown route or missing record |
| `409` | Conflict | Duplicate email, re-deciding a leave request |
| `422` | Unprocessable Entity | Request body failed validation |
| `500` | Internal Server Error | Unexpected failure |

Known Prisma errors are translated into clean messages (`P2002` → `409`, `P2003` → `400`, `P2025` → `404`). Anything unrecognized is logged server-side and returned as a generic `500`, so internals never leak to clients.

---

## Production notes

- **Set a strong `JWT_SECRET`.** Rotating it invalidates all issued tokens.
- **Set `NODE_ENV=production`** — this disables stack traces in responses and enables `trust proxy`.
- **Restrict `CORS_ORIGIN`** to your frontend's origin instead of `*`.
- **Use `npm run prisma:deploy`**, not `prisma migrate dev`, on servers.
- **Change the seeded manager password** immediately.
- Graceful shutdown is wired to `SIGINT` and `SIGTERM`: the server stops accepting connections, finishes in-flight requests, releases the Prisma pool, and force-exits after 10s if something hangs.
- Consider adding rate limiting on `/auth/login` (e.g. `express-rate-limit`) before exposing the API publicly.

---

## Deployment

Deployed at **https://employee-management-api-w51q.onrender.com**.

`render.yaml` is a [Render Blueprint](https://render.com/docs/blueprint-spec) that deploys the API on Render's free web service tier, backed by a free [Neon](https://neon.com) PostgreSQL database.

The database deliberately lives outside the blueprint: Render deletes free PostgreSQL instances 30 days after creation, while Neon's free tier does not expire.

### 1. Create the database

Sign up at Neon and create a project in **AWS US East 2 (Ohio)**, matching the `region: ohio` pinned in `render.yaml` — a cross-region pairing adds latency to every query.

Copy the **pooled** connection string (the host contains `-pooler`). The pooled endpoint matters because free Render instances restart often, and the direct endpoint would exhaust Neon's connection limit.

### 2. Deploy the API

In the Render dashboard: **New → Blueprint**, select this repository, then set `DATABASE_URL` to the Neon string when prompted. Everything else in the blueprint is applied automatically:

| Setting | Value |
| --- | --- |
| Build | `npm install && npx prisma generate && npx prisma migrate deploy` |
| Start | `npm start` |
| Health check | `/api/health` |
| Region | `ohio` |
| `JWT_SECRET` | Generated by Render on first deploy |
| `PORT` | Injected by Render |

Render appends a random suffix to the hostname when the service name is already taken globally — this deployment became `employee-management-api-w51q`, not `employee-management-api`. Take the real URL from the top of the service page rather than assuming it.

### 3. Seed the accounts

Free services have no shell, so run the seed from your machine against the deployed database:

```bash
DATABASE_URL="<neon-connection-string>" npm run seed
```

### Free tier limits

- Web services spin down after 15 minutes of inactivity; the next request takes about a minute while the service wakes.
- 750 instance hours per workspace per month.
- Neon free tier: 0.5 GB storage, 100 CU-hours per month.

Set `CORS_ORIGIN` to your frontend's origin once it is deployed.

---

## Scope

The API implements exactly the functionality in the two dashboards — employees, salary, tasks, projects, schedules and leave. There is deliberately no attendance, payroll, notification, chat, analytics or reporting module.
