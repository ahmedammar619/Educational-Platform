# Baraem Al-Noor Educational Platform

An innovative educational platform that delivers high‑quality learning experiences for children. This repository contains a production‑ready monorepo scaffold with Dockerized services, a typed backend, a modern React frontend, and a PostgreSQL schema designed to meet the functional and non‑functional requirements outlined in `Docs/Documentation of BAN.txt` and `Docs/Requirements of BAN.txt`.

### Monorepo layout
- `backend/`: Node.js + Express + TypeScript service (API, auth, RBAC, LMS/SIS endpoints)
- `frontend/`: React + Vite + TypeScript app (Student, Teacher, Parent, Admin dashboards)
- `database/`: PostgreSQL schema (`schema.sql`) and initial seed data (`seed.sql`)
- `docker-compose.yml`: One‑command local stack with Postgres and pgAdmin
- `Docs/`: Product documentation and requirements

## Features and scope

This scaffold maps directly to the documented needs. Below is the implementation plan and what is already in place in this repo.

- **Dashboards**
  - Student: Child‑friendly UI, join‑class links, activities, grades, assignment notifications, portfolio
  - Teacher: Class management, attendance, homework, performance evaluation, Zoom screen/file sharing hooks
  - Parent: Progress tracking, memorization/comprehension, messaging, billing notifications, transfer/withdraw requests
  - Admin: System widgets (active students/teachers/classes today/attendance/tickets/monthly revenue), user/content/schedule management

- **Core systems**
  - LMS: Courses, contents (PDF/PPT/Video/Worksheet/Link), assignments, submissions, assessments, portfolio
  - SIS: Users, parents, teachers, students, enrollment, attendance, schedules/classes
  - RBAC: Roles, permissions, role‑permission mapping, user‑roles
  - Messaging/Notifications: Direct messages, in‑app/email notifications, audience targeting
  - Financials: Coupons, subscriptions (weekly/monthly/quarterly with auto‑renew), invoices, payments
  - Support: Tickets, comments, priorities, statuses
  - Analytics: Zoom activity (words/sounds/time spent), performance results
  - Settings/Security: Multi‑tenant‑ready settings, activity logs, 2FA metadata, child‑safety orientation

- **Integrations (designed, wired for future keys)**
  - Zoom API: Class join/start URLs, breakout support, auto‑recording, recordings storage pointer
  - Google Calendar/iCal: Schedule sync
  - Mail service: Email notifications/newsletters
  - Payment gateway: Invoices, payments, refunds
  - Analytics/UX: Google Analytics/Hotjar

## Architecture overview

- **Backend**: Node 20, Express, TypeScript, Zod for validation, `pg` for DB. Production Docker image serves compiled JS.
- **Frontend**: React 18 + Vite. Production container runs `vite preview` behind Docker.
- **Database**: PostgreSQL 16 with a normalized schema covering LMS, SIS, RBAC, scheduling, content, billing, support, analytics, and audit logging.
- **Observability (local)**: API request logging via `morgan`. DB health via `/api/health`.

## Getting started (Docker)

Prerequisites:
- Docker Desktop 4.x+

Environment variables (optional overrides):
- `POSTGRES_DB` (default: `ban`)
- `POSTGRES_USER` (default: `ban_user`)
- `POSTGRES_PASSWORD` (default: `ban_password`)
- `PGADMIN_DEFAULT_EMAIL` (default: `admin@local.test`)
- `PGADMIN_DEFAULT_PASSWORD` (default: `admin123`)
- `NODE_ENV` (default: `development`)

Run the stack:

```bash
cd /Users/ahmedammar/Documents/Educational-Platform
docker compose up -d --build
```

Services:
- Backend API: `http://localhost:8080/api`
- Frontend app: `http://localhost:5173`

External PostgreSQL is used (no local DB containers). Current connection string:

```
postgresql://baraem:ccydwmbxszD2997s@j2zr.your-database.de:5432/baraem?sslmode=require
```

To change it, edit `DATABASE_URL` in `docker-compose.yml` or backend environment.

## Local development (without Docker)

Backend:
```bash
cd backend
cp .env.example .env   # if available; otherwise set DATABASE_URL env var
npm ci
npm run dev
```

## Importing the database schema to the external Postgres

We use a one-time ephemeral `psql` container to import `database/schema.sql` and `database/seed.sql` into your managed Postgres. Ensure the DB `baraem` exists on your server.

```bash
# Import schema
docker run --rm -v $(pwd)/database:/database:ro --network host \
  postgres:16-alpine sh -c "PGPASSWORD=ccydwmbxszD2997s psql -h j2zr.your-database.de -U baraem -d baraem -f /database/schema.sql"

# Import seed
docker run --rm -v $(pwd)/database:/database:ro --network host \
  postgres:16-alpine sh -c "PGPASSWORD=ccydwmbxszD2997s psql -h j2zr.your-database.de -U baraem -d baraem -f /database/seed.sql"
```

If `uuid-ossp` extension creation is restricted by your provider, make sure it is enabled by your admin or adapt the schema accordingly.

Frontend:
```bash
cd frontend
npm ci
npm run dev
```

## API surface (initial)

- `GET /api/health`: DB connectivity probe `{ status: "ok", db: true }`

Planned modules (endpoints forthcoming):
- Auth: register/login/logout, refresh tokens, 2FA setup/verify, password reset
- Users/RBAC: CRUD users, assign roles/permissions
- Classes/Schedules/Zoom: CRUD classes, enrollment, attendance, Zoom meeting lifecycle, recordings
- Content/LMS: CRUD courses/contents/assignments/submissions/assessments/portfolio
- SIS: Students/Teachers/Parents management, CSV import
- Messaging/Notifications: Direct messages, bulk audiences, email/app channels
- Financials: Coupons, subscriptions, invoices, payments, exports (Excel/PDF)
- Reports/Analytics: Performance dashboards, attendance, teacher effectiveness, Zoom interaction
- Support: Tickets, comments, internal notifications
- Settings/Audit: System settings, activity logs

## Database schema highlights

Implemented in `database/schema.sql` with enums and tables to fulfill requirements:
- RBAC: `roles`, `permissions`, `role_permissions`, `users`, `user_roles`
- Auth/security: `user_two_factor`, `auth_sessions`, `password_resets`, `activity_logs`
- Domain: `parents`, `teachers`, `students`, `student_access_codes`
- Scheduling: `schedules`, `classes`, `enrollments`, `attendance`
- LMS: `contents`, `assignments`, `submissions`, `assessments`, `assessment_results`, `portfolio_items`
- Messaging: `messages`, `notifications`
- Financials: `coupons`, `subscriptions`, `invoices`, `payments`
- Analytics: `zoom_activity`, `zoom_recordings`
- Settings: `system_settings`

Indexes are added for common access paths. See file for details and constraints.

Seed data (`database/seed.sql`):
- Creates roles: `ADMIN`, `FINANCE`, `SUPERVISOR`, `SUPPORT`, `TEACHER`, `PARENT`, `STUDENT`
- Minimal permissions and role mappings (expandable)
- Initial admin user `admin@ban.local` (password hash placeholder). To set a password, generate a bcrypt hash and update the row:

```bash
# Generate a bcrypt hash (Node.js one‑liner)
node -e "(async()=>{const b=require('bcryptjs');console.log(await b.hash('ChangeMe123!',10));})()"

# In psql
UPDATE users SET password_hash = '<PASTE_BCRYPT_HASH>' WHERE email = 'admin@ban.local';
```

## Security and child safety

- Transport security: Use SSL/TLS in production (terminate TLS at gateway/load‑balancer).
- Authentication: JWT access tokens + refresh tokens, optional 2FA for teachers/admins (`user_two_factor`).
- RBAC: Strict role/permission checks at route level.
- Audit: Activity logs of logins, class changes, uploads, financial actions.
- Child protection: Data minimization, clear privacy policy for parents, content monitoring hooks.

## Integrations (placeholders)

The backend exposes configuration placeholders for:
- Zoom (`ZOOM_API_KEY`, `ZOOM_API_SECRET`) for meeting creation, join URLs, breakout rooms, recordings
- Email/SMTP for notifications
- Google Calendar/iCal for schedule sync
- Payment gateway API keys

These should be added as environment variables in deployment.

## Environment configuration

- Backend envs (examples):
  - `PORT` (default `8080`)
  - `DATABASE_URL` (e.g. `postgresql://ban_user:ban_password@localhost:5432/ban`)
  - `JWT_SECRET`
  - `TWO_FA_ISSUER` (e.g. `BaraemAlNoor`)
  - SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - External: `ZOOM_API_KEY`, `ZOOM_API_SECRET`, `GOOGLE_CALENDAR_API_KEY`, `PAYMENT_GATEWAY_API_KEY`

- Frontend envs:
  - `VITE_API_BASE_URL` (default via docker: `http://backend:8080/api`, local: `http://localhost:8080/api`)

## Building and running tests

This scaffold focuses on infrastructure and the initial schema. Unit/integration tests should be added as endpoints are implemented. CI can run:

```bash
docker compose build
docker compose up -d
curl http://localhost:8080/api/health
```

## Roadmap (implementation order)

1) Auth + RBAC + Users
2) SIS (Students/Teachers/Parents), CSV import
3) Scheduling/Classes + Zoom integration
4) LMS (Content/Assignments/Assessments/Submissions/Portfolio)
5) Messaging/Notifications
6) Financials (Coupons/Subscriptions/Invoices/Payments + Exports)
7) Smart Dashboards + Analytics/Reports
8) Support/Tickets + Internal notifications
9) Settings + Activity logs + 2FA enforcement

## Licensing and compliance

- Ensure compliance with child‑protection regulations (e.g., COPPA) in production deployments.
- Add licensing information appropriate for this project before distribution.

## Contributing

PRs are welcome. Please align endpoints, models, and UI with the requirements in `Docs/` and update this README as features land.

