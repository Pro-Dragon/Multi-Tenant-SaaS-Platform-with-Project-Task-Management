# Multi-Tenant SaaS Platform with Project & Task Management

A production-ready multi-tenant SaaS application with comprehensive project and task management capabilities. Built with Node.js, Express, React, and PostgreSQL. Fully containerized with Docker Compose.

## 🎯 Features

- **Multi-Tenant Architecture** - Strict data isolation between tenants
- **Role-Based Access Control** - super_admin, admin, and user roles
- **JWT Authentication** - 24-hour token expiry with bcryptjs hashing
- **19 RESTful APIs** - Complete CRUD operations for all resources
- **Subscription-Based Limits** - Configurable max users and projects per plan
- **Audit Logging** - Track all modifications for compliance
- **React Frontend** - Modern UI with protected routes
- **Automatic Database Setup** - Migrations and seeding on startup
- **Docker Containerization** - Multi-container orchestration with health checks

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│         http://localhost:3000                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend (Express.js)                   │
│         http://localhost:5000/api                       │
│  • 19 RESTful endpoints                                 │
│  • JWT authentication middleware                        │
│  • Zod input validation                                 │
│  • RBAC enforcement                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL 15)                   │
│         localhost:5432                                  │
│  • Tenant, User, Project, Task, AuditLog tables         │
│  • Prisma ORM with migrations                           │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development only)

### Start Services
```bash
docker-compose up -d
```

Services will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Database:** localhost:5432

### Check Status
```bash
docker-compose ps
```

All containers should show `Healthy` or `Running` status.

### Stop Services
```bash
docker-compose down
```

## 📱 Using the Application

### 1. Login (Demo)
Navigate to **http://localhost:3000** and login with:

**Super Admin Account:**
- Email: `superadmin@system.com`
- Password: `Admin@123`

**Demo Tenant Admin:**
- Email: `admin@demo.com`
- Password: `Demo@123`
- Tenant: `demo`

**Demo Tenant User:**
- Email: `user1@demo.com`
- Password: `User@123`
- Tenant: `demo`

Or:
- Email: `user2@demo.com`
- Password: `User@123`
- Tenant: `demo`

### 2. Register New Tenant
Click "Register" to create a new tenant with custom admin credentials.

### 3. Manage Users
Access the Users page to:
- View all users in your tenant
- Add new users with different roles
- Update user information
- Remove users

### 4. Create Projects
Navigate to Projects to:
- Create new projects
- Edit project details
- Archive/activate projects
- Delete projects

### 5. Manage Tasks
In Tasks, you can:
- Create tasks within projects
- Set priority (low/medium/high)
- Track status (pending/in_progress/completed)
- Update and delete tasks

## 📚 API Documentation

Comprehensive API documentation is available in [docs/API.md](docs/API.md)

### Quick API Example

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "demo123",
    "tenantSubdomain": "demo"
  }'
```

**Create Project:**
```bash
curl -X POST http://localhost:5000/api/tenants/{tenantId}/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "My Project",
    "description": "Project description",
    "status": "active"
  }'
```

## 🔐 Authentication

### JWT Token Flow
1. User login → Server issues 24-hour JWT token
2. Token included in `Authorization: Bearer <token>` header
3. All requests validated with middleware
4. Token expires → User must login again

### Token Payload
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## 📊 Database Schema

### Tenant
- `id` (UUID, primary key)
- `name` (string)
- `subdomain` (string, unique)
- `status` (enum: active, inactive)
- `subscription` (enum: free, pro, enterprise)
- `maxUsers` (integer)
- `maxProjects` (integer)

### User
- `id` (UUID, primary key)
- `email` (string)
- `password` (hashed with bcryptjs)
- `fullName` (string)
- `role` (enum: user, admin)
- `tenantId` (UUID, foreign key)
- `createdAt` (timestamp)

### Project
- `id` (UUID, primary key)
- `name` (string)
- `description` (text)
- `status` (enum: active, archived)
- `tenantId` (UUID, foreign key)
- `createdAt` (timestamp)

### Task
- `id` (UUID, primary key)
- `title` (string)
- `description` (text)
- `priority` (enum: low, medium, high)
- `status` (enum: pending, in_progress, completed)
- `projectId` (UUID, foreign key)
- `createdAt` (timestamp)

### AuditLog
- `id` (UUID, primary key)
- `userId` (UUID)
- `tenantId` (UUID)
- `action` (string)
- `entityType` (string)
- `entityId` (UUID)
- `changes` (JSON)
- `createdAt` (timestamp)

## 🧪 Testing

### Run Integration Tests
```bash
node integration-test.js
```

This tests all 19 API endpoints with realistic workflows.

### Manual Testing with cURL
See [docs/API.md](docs/API.md) for cURL examples for each endpoint.

## 📁 Project Structure

```
.
├── frontend/                          # React frontend
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   └── TasksPage.jsx
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx    # Route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Auth state
│   │   ├── services/
│   │   │   └── api.js                # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── Dockerfile
│   └── package.json
│
├── backend/                           # Node.js backend
│   ├── src/
│   │   ├── controllers/              # Business logic (19 endpoints)
│   │   │   ├── authController.ts
│   │   │   ├── tenantsController.ts
│   │   │   ├── usersController.ts
│   │   │   ├── projectsController.ts
│   │   │   └── tasksController.ts
│   │   ├── routes/                   # Express routes
│   │   ├── middleware/               # Auth & validation
│   │   ├── utils/                    # JWT, audit logging
│   │   ├── types/                    # TypeScript types
│   │   ├── prisma.ts                 # Prisma client
│   │   └── index.ts                  # Express app entry
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   └── seed.js                   # Seeding script
│   ├── Dockerfile
│   ├── entrypoint.sh                 # Container startup
│   ├── tsconfig.json
│   ├── package.json
│   └── jest.config.js
│
├── docs/
│   └── API.md                        # Complete API documentation
│
├── docker-compose.yml                # Multi-container orchestration
├── submission.json                   # Project metadata
├── integration-test.js               # API integration tests
└── README.md                         # This file
```

## 🔧 Environment Variables

### Backend (auto-configured in Docker)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing tokens
- `NODE_ENV` - Environment (development/production)

### Frontend (auto-configured)
- `VITE_API_URL` - Backend API URL (defaults to http://localhost:5000)

## 🛡️ Security Features

- **Password Hashing** - bcryptjs with cost factor 10
- **JWT Tokens** - HS256 algorithm, 24-hour expiry
- **Input Validation** - Zod schema validation on all endpoints
- **RBAC** - Role-based access control middleware
- **Data Isolation** - Tenant data strictly isolated
- **Audit Logging** - All modifications tracked
- **CORS** - Configured for frontend origin
- **Non-Root Container** - Docker runs as non-root user

## 📈 Subscription Plans

| Plan | Max Users | Max Projects | Features |
|------|-----------|--------------|----------|
| Free | 5 | 2 | Basic task management |
| Pro | 50 | 10 | All features |
| Enterprise | Unlimited | Unlimited | Full feature access |

Limits are enforced at API level - attempting to exceed limits returns `400 Bad Request`.

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker logs backend -f
docker logs frontend -f
docker logs database -f

# Stop all services
docker-compose down

# Remove all volumes (WARNING: deletes database)
docker-compose down -v

# Rebuild specific service
docker-compose build backend

# Run tests in container
docker-compose exec backend npm test
```

## 🧠 Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React | 18.2.0 |
| Frontend Build | Vite | 5.1.0 |
| Frontend Router | React Router | 6.8.0 |
| Backend | Express.js | 4.18 |
| Language | TypeScript | 5.1 |
| Runtime | Node.js | 18 |
| Database | PostgreSQL | 15 |
| ORM | Prisma | 5.1 |
| Auth | JWT | 9.0.0 |
| Hashing | bcryptjs | 2.4.3 |
| Validation | Zod | Latest |
| Testing | Jest | Latest |
| Container | Docker | Latest |

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs <container_name>

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Database connection error
```bash
# Ensure database is ready
docker-compose logs database

# Wait 10 seconds and retry
docker-compose down
docker-compose up -d
```

### Frontend not loading
```bash
# Check frontend logs
docker logs frontend

# Verify VITE_API_URL is correct
# Should be http://localhost:5000 or http://backend:5000 inside container
```

### API returns 401 Unauthorized
- Token may be expired (24 hour expiry)
- Login again to get new token
- Verify `Authorization: Bearer <token>` header format

## 📞 Support

For detailed API information, see [docs/API.md](docs/API.md)

For implementation details, check the TypeScript source files with comprehensive JSDoc comments.

## 📝 Notes

- All timestamps are stored in UTC
- Email addresses must be unique within a tenant (not globally)
- Super admin accounts cannot be created via register endpoint
- Passwords are hashed with bcryptjs cost factor 10
- Audit logs are created for all data modifications
- Frontend uses localStorage for token persistence
- The seed script creates demo data on first startup

## ✨ Features Demonstrated

✅ Multi-tenant architecture with strict isolation
✅ RBAC with super_admin, admin, and user roles
✅ JWT authentication with token expiry
✅ Comprehensive input validation (Zod)
✅ 19 fully functional API endpoints
✅ Subscription-based resource limits
✅ Automatic database migrations
✅ Audit logging system
✅ React frontend with protected routes
✅ Docker containerization
✅ Health checks
✅ Error handling
✅ TypeScript type safety
✅ Jest unit tests
✅ Complete API documentation

## 📄 License

This project is provided as-is for demonstration purposes.

---

**Built with ❤️ using Node.js, Express, React, and PostgreSQL**
