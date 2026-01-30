# Database Schema Documentation

## Overview
PostgreSQL 15 database with Prisma 5.1 ORM. All tables use UUID primary keys and include audit timestamps. Multi-tenant isolation enforced via `tenantId` foreign key constraints.

---

## Tables

### 1. Tenant
Represents organizations/companies using the SaaS platform.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique tenant identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| subdomain | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly tenant identifier |
| status | ENUM | DEFAULT 'active' | active, suspended, trial |
| subscriptionPlan | ENUM | DEFAULT 'free' | free, pro, enterprise |
| maxUsers | INTEGER | DEFAULT 5 | Subscription limit for users |
| maxProjects | INTEGER | DEFAULT 3 | Subscription limit for projects |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | ON UPDATE | Last modification timestamp |

**Enums:**
- `TenantStatus`: active, suspended, trial
- `SubscriptionPlan`: free, pro, enterprise

**Indexes:**
- subdomain (UNIQUE)
- status
- subscriptionPlan

---

### 2. User
System users with role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| tenantId | UUID | FOREIGN KEY (nullable) | References Tenant.id; NULL for super_admin |
| email | VARCHAR(255) | NOT NULL | User email address |
| passwordHash | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| fullName | VARCHAR(255) | NOT NULL | User's full name |
| role | ENUM | DEFAULT 'user' | super_admin, tenant_admin, user |
| isActive | BOOLEAN | DEFAULT true | Account active flag |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | ON UPDATE | Last modification timestamp |

**Enums:**
- `UserRole`: super_admin, tenant_admin, user

**Constraints:**
- UNIQUE(tenantId, email) - Email unique per tenant
- FOREIGN KEY (tenantId) → Tenant(id) ON DELETE CASCADE

**Indexes:**
- tenantId
- email
- role

---

### 3. Project
Projects within tenants for organizing tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique project identifier |
| tenantId | UUID | FOREIGN KEY | References Tenant.id; NOT NULL |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULLABLE | Project description |
| status | ENUM | DEFAULT 'active' | active, archived, completed |
| createdBy | UUID | FOREIGN KEY | References User.id (creator) |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | ON UPDATE | Last modification timestamp |

**Enums:**
- `ProjectStatus`: active, archived, completed

**Constraints:**
- FOREIGN KEY (tenantId) → Tenant(id) ON DELETE CASCADE
- FOREIGN KEY (createdBy) → User(id) ON DELETE CASCADE

**Indexes:**
- tenantId
- status
- createdBy

---

### 4. Task
Tasks within projects assigned to users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique task identifier |
| projectId | UUID | FOREIGN KEY | References Project.id; NOT NULL |
| tenantId | UUID | FOREIGN KEY | References Tenant.id; NOT NULL |
| title | VARCHAR(255) | NOT NULL | Task title |
| description | TEXT | NULLABLE | Task description |
| status | ENUM | DEFAULT 'todo' | todo, in_progress, completed |
| priority | ENUM | DEFAULT 'medium' | low, medium, high |
| assignedTo | UUID | FOREIGN KEY (nullable) | References User.id (assignee) |
| dueDate | TIMESTAMP | NULLABLE | Task due date |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | ON UPDATE | Last modification timestamp |

**Enums:**
- `TaskStatus`: todo, in_progress, completed
- `TaskPriority`: low, medium, high

**Constraints:**
- FOREIGN KEY (projectId) → Project(id) ON DELETE CASCADE
- FOREIGN KEY (tenantId) → Tenant(id) ON DELETE CASCADE
- FOREIGN KEY (assignedTo) → User(id) ON DELETE SET NULL

**Indexes:**
- projectId
- tenantId
- assignedTo
- status
- priority
- dueDate

---

### 5. AuditLog
Immutable audit trail for compliance and debugging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique log identifier |
| tenantId | UUID | FOREIGN KEY | References Tenant.id; NOT NULL |
| userId | UUID | FOREIGN KEY | References User.id (who performed action) |
| action | VARCHAR(50) | NOT NULL | CREATE_TENANT, LOGIN, CREATE_USER, UPDATE_TASK, etc. |
| entityType | VARCHAR(50) | NOT NULL | Resource type: tenant, user, project, task |
| entityId | UUID | NULLABLE | ID of affected resource |
| ipAddress | VARCHAR(45) | NULLABLE | Client IP address |
| createdAt | TIMESTAMP | DEFAULT now() | When action occurred |

**Constraints:**
- FOREIGN KEY (tenantId) → Tenant(id) ON DELETE CASCADE
- FOREIGN KEY (userId) → User(id) ON DELETE SET NULL

**Indexes:**
- tenantId
- userId
- action
- entityType
- createdAt

---

## Relationships Diagram

```
Tenant (1) ─── (many) User
   │
   ├─ (1) ─── (many) Project
   │                    │
   │                    ├─ (1) ─── (many) Task
   │
   └─ (1) ─── (many) AuditLog

User (1) ←─── (many) Task (assignedTo)
User (1) ←─── (many) Project (createdBy)
```

---

## Multi-Tenancy Isolation Strategy

### Data Isolation
- **Tenant-Scoped Queries**: All queries filter by `tenantId`
- **Cascading Deletes**: Deleting a tenant deletes all child data
- **Email Uniqueness**: Enforced at (tenantId, email) composite level
- **Access Control**: Middleware verifies user.tenantId matches resource.tenantId

### Super Admin Exception
- Super admins have `tenantId = NULL`
- Can view/modify any tenant's data
- Tracked in audit logs with NULL tenantId

---

## Subscription Plan Defaults

| Plan | Max Users | Max Projects |
|------|-----------|--------------|
| Free | 5 | 3 |
| Pro | 25 | 15 |
| Enterprise | 100 | 50 |

---

## Database Migrations

All schema changes managed via Prisma migrations:

```bash
# Generate migration (after schema.prisma change)
npx prisma migrate dev --name description_here

# Apply migrations to production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

---

## Seed Data

On first Docker startup, automatic seeding creates:

**Super Admin User:**
- Email: `superadmin@system.com`
- Password: `Admin@123`
- Role: `super_admin`
- TenantId: `NULL`

**Demo Tenant:**
- Name: `Demo Company`
- Subdomain: `demo`
- Plan: `pro` (25 users, 15 projects)

**Demo Tenant Admin:**
- Email: `admin@demo.com`
- Password: `Demo@123`
- Role: `tenant_admin`

**Demo Users:**
- Email: `user1@demo.com`, `user2@demo.com`
- Password: `User@123`
- Role: `user`

**Demo Data:**
- 2 projects (Beta, Live)
- 5 tasks with various statuses and priorities

---

## Performance Considerations

1. **Connection Pooling**: Prisma uses PgBouncer in Docker
2. **Query Optimization**: Indexes on tenantId, status, and foreign keys
3. **N+1 Prevention**: Prisma prevents lazy loading in production
4. **Audit Logging**: Async writes to prevent API slowdown

---

## Backup & Recovery

```bash
# Backup PostgreSQL database
docker exec database pg_dump -U postgres saas_db > backup.sql

# Restore from backup
docker exec -i database psql -U postgres saas_db < backup.sql
```

---

## Compliance & Security

✅ GDPR-Ready: Audit logs track all data access and modifications
✅ Data Isolation: Strict tenant scoping prevents cross-tenant leakage
✅ Password Security: bcryptjs with cost factor 10
✅ Session Management: 24-hour JWT expiry with refresh capability
✅ Immutable Logs: AuditLog records cannot be modified or deleted
