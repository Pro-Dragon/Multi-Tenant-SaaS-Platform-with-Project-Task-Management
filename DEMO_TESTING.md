# Demo Testing Guide - Complete Walkthrough

This guide demonstrates the complete application with end-to-end testing of the multi-tenant SaaS platform.

## Setup (5 minutes)

### Start Services
```bash
cd repo
docker-compose up -d
```

Verify all 3 containers are healthy:
```bash
docker-compose ps
```

Expected output:
```
NAME      STATUS                PORTS
frontend  Up 10 seconds          0.0.0.0:3000->3000/tcp
backend   Up 15 seconds (healthy) 0.0.0.0:5000->5000/tcp
database  Up 20 seconds (healthy) 0.0.0.0:5432->5432/tcp
```

### Test Backend Connectivity
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"success": true, "message": "API is running"}
```

---

## Demo 1: Super Admin - View All Tenants (5 minutes)

### 1.1 Login as Super Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@system.com",
    "password": "Admin@123"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "superadmin@system.com",
      "role": "super_admin",
      "tenantId": null
    }
  }
}
```

Save the token for subsequent API calls: `TOKEN="<your_token_here>"`

### 1.2 Get All Tenants
```bash
curl -X GET "http://localhost:5000/api/tenants?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Tenants retrieved successfully",
  "data": {
    "tenants": [
      {
        "id": "...",
        "name": "Demo Company",
        "subdomain": "demo",
        "status": "active",
        "subscriptionPlan": "pro",
        "maxUsers": 25,
        "maxProjects": 15,
        "createdAt": "2025-01-30T..."
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 1.3 View Dashboard
Navigate to http://localhost:3000 in your browser:
1. Select tenant: "Demo Company" (auto-selected)
2. View dashboard with:
   - Total Users: 3
   - Total Projects: 2
   - Total Tasks: 0 (or more if seeded)
   - Active Projects: 2

---

## Demo 2: Tenant Admin - Manage Resources (10 minutes)

### 2.1 Login as Tenant Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'
```

Save the new token: `ADMIN_TOKEN="<token>"`

### 2.2 Get Tenant Details
```bash
curl -X GET "http://localhost:5000/api/tenants/{tenantId}" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Shows:
- Tenant name: "Demo Company"
- Subscription plan: "pro" (25 users, 15 projects)
- Current usage stats

### 2.3 List Users in Tenant
```bash
curl -X GET "http://localhost:5000/api/tenants/{tenantId}/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "...",
        "email": "admin@demo.com",
        "fullName": "Demo Admin",
        "role": "admin",
        "createdAt": "2025-01-30T..."
      },
      {
        "id": "...",
        "email": "user1@demo.com",
        "fullName": "Demo User 1",
        "role": "user",
        "createdAt": "2025-01-30T..."
      },
      {
        "id": "...",
        "email": "user2@demo.com",
        "fullName": "Demo User 2",
        "role": "user",
        "createdAt": "2025-01-30T..."
      }
    ],
    "total": 3
  }
}
```

### 2.4 List Projects
```bash
curl -X GET "http://localhost:5000/api/tenants/{tenantId}/projects" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Shows:
- Project Alpha
- Project Beta
- Current usage: 2/15 projects (within limit)

### 2.5 Create New Project
```bash
curl -X POST "http://localhost:5000/api/tenants/{tenantId}/projects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Demo Project",
    "description": "Created from API",
    "status": "active"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "...",
    "name": "New Demo Project",
    "description": "Created from API",
    "status": "active",
    "tenantId": "...",
    "createdAt": "2025-01-30T..."
  }
}
```

### 2.6 View Frontend - Projects Page
Navigate to http://localhost:3000/projects:
1. Login with admin@demo.com / Demo@123 (subdomain: demo)
2. Click on any project to view
3. See the newly created "New Demo Project"

---

## Demo 3: Create and Manage Tasks (10 minutes)

### 3.1 Create Task via API
```bash
# First, get project ID from step 2.5
PROJECT_ID="<id_from_step_2.5>"

curl -X POST "http://localhost:5000/api/projects/{projectId}/tasks" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature X",
    "description": "Add new functionality",
    "priority": "high",
    "status": "todo"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "...",
    "title": "Implement feature X",
    "description": "Add new functionality",
    "priority": "high",
    "status": "todo",
    "projectId": "...",
    "createdAt": "2025-01-30T..."
  }
}
```

### 3.2 List Tasks in Project
```bash
curl -X GET "http://localhost:5000/api/projects/{projectId}/tasks" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Shows:
- Task ID
- Title: "Implement feature X"
- Status: "todo"
- Priority: "high"

### 3.3 Update Task Status
```bash
TASK_ID="<id_from_step_3.1>"

curl -X PATCH "http://localhost:5000/api/tasks/{taskId}/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    "id": "...",
    "status": "in_progress",
    "updatedAt": "2025-01-30T..."
  }
}
```

### 3.4 View in Frontend
Navigate to http://localhost:3000/tasks:
1. Login with admin@demo.com / Demo@123
2. Filter by "New Demo Project"
3. See task status changed to "in_progress"

---

## Demo 4: Subscription Limits (5 minutes)

### 4.1 Try to Exceed User Limit
Demo tenant has maxUsers=25. With 3 existing users, you can add 22 more.

```bash
curl -X POST "http://localhost:5000/api/tenants/{tenantId}/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewPass@123",
    "fullName": "New User",
    "role": "user"
  }'
```

Expected: Success (25 limit not reached)

### 4.2 View Tenant Settings in Frontend
Navigate to http://localhost:3000/settings:
1. Tenant name: "Demo Company"
2. Subscription plan: "pro"
3. Max users: 25 (usage shown)
4. Max projects: 15 (usage shown)
5. Admin can update name only
6. Super admin can update all fields (with updated limits applied)

---

## Demo 5: Role-Based Access Control (5 minutes)

### 5.1 Regular User Cannot Create Project
Login as user1@demo.com (regular user):

```bash
curl -X POST "http://localhost:5000/api/tenants/{tenantId}/projects" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Unauthorized", "description": "Should fail", "status": "active"}'
```

Expected response:
```json
{
  "success": false,
  "message": "Unauthorized: Only admins can create projects"
}
```

### 5.2 Frontend Hides Create Button
Navigate to http://localhost:3000/projects as user1@demo.com:
- "Create Project" button is NOT visible
- Can only view existing projects
- Cannot access settings page

---

## Demo 6: Multi-Tenant Isolation (5 minutes)

### 6.1 Create New Tenant
```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Acme Corp",
    "tenantSubdomain": "acme",
    "adminEmail": "admin@acmecorp.com",
    "adminPassword": "Acme@123",
    "adminFullName": "Acme Admin"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenant": {
      "id": "...",
      "name": "Acme Corp",
      "subdomain": "acme"
    },
    "user": {
      "email": "admin@acmecorp.com",
      "role": "admin",
      "tenantId": "..."
    },
    "token": "..."
  }
}
```

### 6.2 Verify Isolation
Login as Acme admin - cannot see Demo tenant data
Login as Demo admin - cannot see Acme tenant data
Super admin can see both but cannot access their data

---

## Expected Metrics

By completing these demos, you should observe:

✅ **19 API Endpoints Tested:**
- 4 Authentication endpoints (register, login, me, logout)
- 3 Tenant management endpoints
- 4 User management endpoints
- 4 Project management endpoints
- 4 Task management endpoints
- 1 Health check

✅ **Database:** 5 tables with proper relationships
- 1 Tenant created initially (Demo)
- 1 New Tenant created (Acme)
- 6 Users total (3 + 1 new + 2 in new tenant)
- 3 Projects created/viewed
- 1+ Tasks created/updated

✅ **Security Features Working:**
- JWT token validation on protected routes
- Role-based access control enforced
- Subscription limits respected
- Multi-tenant data isolation confirmed
- Audit logging recorded all operations

✅ **Frontend Features Working:**
- Protected routes prevent unauthorized access
- Forms validate input
- Real-time updates without page reload
- Dashboard shows correct statistics
- Settings page controls tenant configuration

---

## Troubleshooting

### Containers not starting?
```bash
docker-compose down
docker volume prune
docker-compose up -d --build
```

### API returning 401 errors?
- Token may have expired (24h expiry)
- Re-run login step and update token

### Database connection refused?
```bash
docker logs database
# Check if database is healthy
docker-compose ps
```

### Port already in use?
Edit docker-compose.yml and change ports (e.g., 3001:3000)

---

## Files Referenced in Demo

- **Backend:** `backend/src/controllers/` - All 19 endpoint implementations
- **Frontend:** `frontend/src/pages/` - All pages with CRUD operations
- **Database:** `backend/prisma/schema.prisma` - 5 table definitions
- **Documentation:** See [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) for individual curl commands
