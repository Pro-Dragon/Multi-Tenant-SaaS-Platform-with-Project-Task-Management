# Research Document

## Multi-Tenancy Approach
- **Options considered:**
	- Separate DB per tenant (strong isolation, higher ops cost).
	- Separate schema per tenant (isolation with growing schema count).
	- **Chosen:** Shared schema with tenant_id column (best balance of cost, simplicity, and scale for SMB-grade SaaS). Foreign-key filtering + indices on tenant_id for performance.

## Architecture Rationale
- **Backend:** Node.js + Express + TypeScript for fast API delivery and type safety; Prisma for DX and migrations.
- **Frontend:** React + Vite for fast dev/build, React Router for SPA navigation.
- **Database:** PostgreSQL for relational integrity, enums, and transactions.
- **Auth:** JWT (HS256) with 24h expiry; fits stateless scaling behind load balancers.
- **Containerization:** Docker Compose for one-command bring-up across db/backend/frontend.

## Security Considerations
- Passwords hashed with bcrypt (cost 10).
- JWT signed with strong secret; bearer required on protected routes.
- RBAC enforced per endpoint (super_admin, tenant_admin, user).
- Tenant isolation: every query filtered by tenant_id (NULL allowed only for super admin).
- Input validation via Zod on all payloads.
- Audit logging for critical actions (auth, CRUD mutations).
- CORS restricted to frontend origin in container network; HTTPS recommended in prod.

## Data Model Notes
- Composite unique (tenantId, email) to allow same email across tenants.
- Cascading deletes on tenant → users/projects/tasks; tasks reference project + tenant for guardrails.
- Indices on tenant_id and common lookup fields to keep list queries performant.

## Operational Considerations
- Migrations + seed run on container start (entrypoint). Health check blocks until DB ready.
- Environment-driven config for DB, JWT, and URLs; no secrets committed.
- Integration test script covers 19 endpoints and ensures tenant scoping + RBAC.

## Future Enhancements (not in scope)
- SSO (OAuth/SAML), rate limiting, IP allowlists.
- Background jobs for audit analytics and email notifications.
- Multi-region read replicas and point-in-time recovery.
