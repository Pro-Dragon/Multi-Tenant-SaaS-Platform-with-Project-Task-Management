# Super Admin Permissions

This document outlines all the actions and permissions available to Super Admin users in the Multi-Tenant SaaS Platform.

## Super Admin Characteristics

- **Role**: `super_admin`
- **Tenant ID**: `NULL` (not associated with any specific tenant)
- **Authentication**: Uses standard JWT authentication with `superadmin@system.com`
- **Access Level**: System-wide, can access all tenants

---

## Super Admin Capabilities

### 1. Dashboard Access ✅
- **Endpoint**: `GET /dashboard`
- **Description**: View system dashboard
- **Can See**: 
  - System statistics (users, projects, tasks counts)
  - All tenants' data overview
  - System health status

### 2. View All Tenants ✅
- **Endpoint**: `GET /api/tenants`
- **Description**: List all tenants in the system
- **Permissions**: Super admin ONLY (regular users and tenant admins get 403)
- **Features**:
  - View all organizations/tenants
  - Pagination support
  - Filter by status (active, suspended, trial)
  - Filter by subscription plan (free, pro, enterprise)
  - See statistics: totalUsers, totalProjects for each tenant

### 3. View Tenant Details ✅
- **Endpoint**: `GET /api/tenants/:tenantId`
- **Description**: Get details of any specific tenant
- **Permissions**: Can view ANY tenant (not restricted to own tenant)
- **Response Includes**:
  - Tenant name, subdomain, status, plan
  - Subscription limits (maxUsers, maxProjects)
  - Tenant statistics (totalUsers, totalProjects, totalTasks)

### 4. Update Any Tenant ✅
- **Endpoint**: `PUT /api/tenants/:tenantId`
- **Description**: Modify tenant information
- **Super Admin CAN Update**:
  - Tenant name ✅
  - Tenant status (active, suspended, trial) ✅ **SUPER ADMIN ONLY**
  - Subscription plan (free, pro, enterprise) ✅ **SUPER ADMIN ONLY**
  - Max users limit ✅ **SUPER ADMIN ONLY**
  - Max projects limit ✅ **SUPER ADMIN ONLY**
- **Note**: Tenant admins can ONLY update name; cannot change status or plan

### 5. View Tenant Users ✅
- **Endpoint**: `GET /api/tenants/:tenantId/users`
- **Description**: List all users in ANY tenant
- **Permissions**: Can view users from any tenant (not restricted)
- **Features**:
  - View all users with their roles
  - Search by email or name
  - Filter by role (user, tenant_admin)
  - Pagination support

### 6. View Tenant Projects ✅
- **Endpoint**: `GET /api/projects` (when viewing another tenant)
- **Description**: View projects from any tenant
- **Permissions**: Can access any tenant's projects
- **Features**:
  - Filter by status
  - Search by name
  - Pagination support

### 7. Authentication & Access ✅
- **Endpoint**: `POST /api/auth/login`
- **Description**: Login as super admin
- **Credentials**: 
  - Email: `superadmin@system.com`
  - Password: `Admin@123` (hashed in database)
- **Result**: Gets JWT token with `tenantId: null` and `role: super_admin`

### 8. View Current User Info ✅
- **Endpoint**: `GET /api/auth/me`
- **Description**: Get super admin's own profile
- **Returns**:
  - User ID, email, full name, role
  - No specific tenant associated (tenantId: null)

### 9. Logout ✅
- **Endpoint**: `POST /api/auth/logout`
- **Description**: End super admin session

---

## Super Admin Restrictions

### Actions Super Admin CANNOT Perform

❌ **Cannot directly manage users, projects, or tasks**
- Super admin cannot create, delete, or update users
- Super admin cannot create, delete, or update projects
- Super admin cannot create, delete, or update tasks
- These operations must be done by tenant admins within their tenants

❌ **Cannot belong to a tenant**
- Super admin has `tenantId = NULL`
- Cannot use tenant-specific endpoints as a member
- Cannot manage resources as if they're part of a tenant

❌ **Cannot register new tenants**
- The tenant registration endpoint is public (no auth required)
- New tenants are registered by themselves, not by super admin

---

## Super Admin Use Cases

1. **System Monitoring**
   - View all tenants and their statistics
   - Monitor overall system usage
   - Check subscription compliance

2. **Subscription Management**
   - Upgrade/downgrade tenant plans
   - Increase or decrease user/project limits
   - Monitor plan usage against limits

3. **Tenant Status Management**
   - Activate or suspend tenants
   - Manage trial vs active status
   - Handle compliance issues

4. **System Administration**
   - View audit logs (if implemented)
   - Monitor system health
   - View dashboard statistics

5. **Support & Troubleshooting**
   - View any tenant's data (for support purposes)
   - Verify user accounts
   - Check project and task details

---

## API Endpoints Summary

| Endpoint | Method | Super Admin Access | Description |
|----------|--------|-------------------|-------------|
| `/api/auth/login` | POST | ✅ Public | Login as super admin |
| `/api/auth/me` | GET | ✅ Yes | View super admin profile |
| `/api/auth/logout` | POST | ✅ Yes | Logout |
| `/api/tenants` | GET | ✅ ONLY | List all tenants |
| `/api/tenants/:id` | GET | ✅ Yes | View any tenant |
| `/api/tenants/:id` | PUT | ✅ Yes | Update any tenant (all fields) |
| `/api/tenants/:id/users` | GET | ✅ Yes | View any tenant's users |
| `/api/tenants/:id/users` | POST | ❌ No | Cannot add users |
| `/api/users/:id` | PUT | ❌ No | Cannot update users |
| `/api/users/:id` | DELETE | ❌ No | Cannot delete users |
| `/api/projects` | GET | ✅ Yes | View any tenant's projects |
| `/api/projects` | POST | ❌ No | Cannot create projects |
| `/api/projects/:id` | PUT | ❌ No | Cannot update projects |
| `/api/projects/:id` | DELETE | ❌ No | Cannot delete projects |
| `/api/projects/:id/tasks` | GET | ✅ Yes | View any project's tasks |
| `/api/projects/:id/tasks` | POST | ❌ No | Cannot create tasks |
| `/api/tasks/:id` | PUT | ❌ No | Cannot update tasks |
| `/api/tasks/:id/status` | PATCH | ❌ No | Cannot update task status |
| `/api/tasks/:id` | DELETE | ❌ No | Cannot delete tasks |

---

## Authorization Logic

```typescript
// Super Admin Check
if (req.user.role === 'super_admin') {
  // Can access any tenant's data without restrictions
  // tenantId is automatically null
  // No tenant isolation filter applied
}

// When accessing specific tenant
if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
  return 403 Forbidden; // Regular users restricted to their tenant
}

// For super admin - always allowed (user can be super_admin)
if (req.user.role === 'super_admin') {
  return proceed; // No tenant_id check needed
}
```

---

## Test Super Admin Access

1. **Login as Super Admin**
   ```
   Email: superadmin@system.com
   Password: Admin@123
   Subdomain: (leave blank or use any - not checked for super admin)
   ```

2. **Test Endpoints**
   ```bash
   # List all tenants
   curl -H "Authorization: Bearer {token}" http://localhost:5000/api/tenants
   
   # View specific tenant details
   curl -H "Authorization: Bearer {token}" http://localhost:5000/api/tenants/{tenantId}
   
   # Update tenant plan
   curl -X PUT \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"subscriptionPlan":"enterprise","status":"active"}' \
     http://localhost:5000/api/tenants/{tenantId}
   ```

3. **Verify Restrictions**
   ```bash
   # This should return 403 (cannot create projects as super admin)
   curl -X POST \
     -H "Authorization: Bearer {token}" \
     -d '{"name":"Test"}' \
     http://localhost:5000/api/projects
   ```

---

## Summary

**Super Admin is a read-mostly, administrative role that:**
- ✅ Can view all tenants and their data
- ✅ Can manage subscription plans and tenant status
- ✅ Can monitor system-wide statistics
- ❌ Cannot directly manage users, projects, or tasks (tenant admins do that)
- ❌ Does not belong to any specific tenant

This design ensures **data isolation** while allowing **system-wide administration**.
