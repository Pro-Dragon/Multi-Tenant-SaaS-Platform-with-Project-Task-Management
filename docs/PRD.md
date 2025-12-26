# Product Requirements Document

## 1. Overview
Multi-tenant SaaS for project & task management with strict tenant isolation, role-based access, and subscription limits.

## 2. Personas
- **Super Admin**: Operates the platform; manages tenants, plans, and global health.
- **Tenant Admin**: Manages a tenant; invites users, manages projects/tasks, monitors limits.
- **User**: Works on assigned projects/tasks; updates status and collaborates.

## 3. Functional Requirements (FR)
1. Tenant signup with subdomain reservation.
2. Super admin login and global tenant list.
3. Tenant admin/user login scoped by tenant subdomain.
4. JWT-based session with 24h expiry.
5. Tenant CRUD (super admin update plan/status/limits).
6. User CRUD within tenant (admin only for create/delete; self-update profile).
7. Role management: super_admin, tenant_admin, user.
8. Enforce subscription limits (maxUsers, maxProjects) per tenant.
9. Project CRUD within tenant; track status (active/archived/completed).
10. Task CRUD within project; statuses (todo/in_progress/completed) and priorities (low/medium/high).
11. Assign tasks to users in the same tenant; unassign allowed.
12. List/search/filter/paginate users, projects, tasks.
13. Dashboard showing counts and recent activity per tenant.
14. Audit logging of critical actions (auth, create/update/delete).
15. Health check endpoint for readiness/liveness.
16. Email uniqueness per tenant; super admin user has tenantId = null.
17. Protect all tenant data by tenantId scoping in queries.
18. Error handling with consistent JSON { success, message, data? }.
19. Seed demo data for quick start (demo tenant, admin, users, projects, tasks).
20. Dockerized stack (db, backend, frontend) with automated migrations+seed.

## 4. Non-Functional Requirements (NFR)
1. **Security**: JWT, bcrypt hashing, RBAC, validation, audit logs, CORS.
2. **Performance**: Typical API responses < 300ms under moderate load.
3. **Scalability**: Stateless API; DB indexed on tenant and foreign keys.
4. **Availability**: Health endpoints for orchestration; recover via docker-compose restart.
5. **Usability**: Responsive UI, clear errors, protected routes with redirects.
6. **Maintainability**: TypeScript backend, structured folders, lint-ready configs.

## 5. Constraints & Assumptions
- Single shared database with tenant_id isolation.
- Subdomains mapped logically (parameter passed in auth for demo); DNS not enforced in dev.
- Email unique per tenant; super admin not bound to tenant.

## 6. Success Metrics
- New tenant can be registered and logged in within 2 minutes using docker-compose.
- All 19 API endpoints pass integration tests (provided script).
- Subscription limits prevent overage and return 403.
- No cross-tenant data leakage in listings or detail endpoints.

## 7. Out of Scope
- SSO/OAuth, in-app payments, email delivery, file uploads, real-time websockets.
