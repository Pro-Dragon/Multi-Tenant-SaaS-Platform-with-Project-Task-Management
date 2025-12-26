# Technical Specification

## Stack
- Backend: Node.js 18, Express, TypeScript, Prisma, Zod, JWT, bcryptjs.
- Frontend: React 18, Vite, React Router, fetch-based API client.
- Database: PostgreSQL 15.
- Containerization: Docker + docker-compose.

## Project Structure (key paths)
- backend/
	- src/index.ts (Express bootstrap)
	- src/controllers/*.ts (auth, tenants, users, projects, tasks)
	- src/middleware/auth.ts (JWT + RBAC)
	- src/routes/*.ts (route mounts)
	- src/utils/{jwt,audit}.ts
	- src/prisma.ts (client)
	- prisma/schema.prisma, prisma/seed.js
- frontend/
	- src/main.jsx, src/App.jsx (router)
	- src/context/AuthContext.jsx
	- src/components/ProtectedRoute.jsx
	- src/services/api.js
	- src/pages/*.jsx (Login, Register, Dashboard, Users, Projects, Tasks)
- docs/ (API, PRD, research, architecture, technical-spec)
- docker-compose.yml (db, backend, frontend)
- integration-test.js (API integration tests)

## Environment Variables
- Backend (.env example):
	- DATABASE_URL=postgresql://postgres:postgres@database:5432/saas_db
	- JWT_SECRET=<32+ chars>
	- JWT_EXPIRES_IN=24h
	- PORT=5000
	- FRONTEND_URL=http://frontend:3000
- Frontend:
	- VITE_API_URL=http://backend:5000/api

## Local Development (without Docker)
1) Start Postgres locally (5432) and set DATABASE_URL.
2) Backend: `cd backend && npm install && npx prisma migrate deploy && npx prisma db seed && npm run dev`.
3) Frontend: `cd frontend && npm install && npm run dev` (uses VITE_API_URL).

## Docker Workflow
1) `docker-compose up -d`
2) Wait for health: backend /api/health, frontend :3000.
3) Stop: `docker-compose down` (add `-v` to drop volumes).

## Testing
- Integration: from repo root `node integration-test.js` (expects services running).
- Unit (backend): `cd backend && npm test`.

## API Notes
- Auth endpoints: /api/auth/register-tenant, /login, /me, /logout.
- RBAC enforced via middleware; tenantId filtered on data routes; super_admin has tenantId null.
- Consistent response envelope: { success, message?, data? } and proper HTTP status codes.

## Deployment Notes
- Provide env vars securely; use strong JWT_SECRET; enable HTTPS and CORS allowlist.
- Run migrations on deploy: `npx prisma migrate deploy`.
- Build frontend: `npm run build` (frontend) and serve static (Dockerfile already set to serve).
