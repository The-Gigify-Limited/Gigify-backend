# 📘 Gigify Backend – Codebase Structure Guide

Welcome to the Gigify backend! This guide explains how the codebase is organized and how to contribute to it. Whether you're adding a new feature, fixing a bug, or understanding how things work, this guide is your roadmap.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure Explained](#2-folder-structure-explained)
3. [Code Organization Philosophy](#3-code-organization-philosophy)
4. [Adding New Code (Top Layer Guide)](#4-adding-new-code-top-layer-guide)
5. [Internal Architecture (Deep Layer Guide)](#5-internal-architecture-deep-layer-guide)
6. [Data Flow Explained](#6-data-flow-explained)
7. [Dependency Rules](#7-dependency-rules)
8. [Coding Standards & Conventions](#8-coding-standards--conventions)
9. [Common Mistakes](#9-common-mistakes)
10. [Quick Contributor Checklist](#10-quick-contributor-checklist)

---

# 1. Project Overview

## What Is This?

Gigify Backend is an **Express.js + TypeScript** REST API server. It handles:

-   User authentication and authorization
-   Multi-role access control (Talent, Employer, Admin)
-   Resource management (Gigs, Users, Earnings, etc.)
-   Event-driven architecture for decoupled components
-   Supabase for database and auth

## Tech Stack At A Glance

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Server     | Express.js 4.18                  |
| Language   | TypeScript 5                     |
| Database   | Supabase (PostgreSQL + Auth)     |
| Caching    | Redis (ioredis)                  |
| Validation | Joi                              |
| Emails     | SendGrid                         |
| SMS        | Twilio                           |
| Logging    | Winston                          |
| Dev Tools  | nodemon, ESLint, Prettier, Husky |

---

# 2. Folder Structure Explained

## High-Level Overview

```
backend/
├── src/                        # All source code (TypeScript)
│   ├── main.ts                # Application entry point
│   ├── app/                   # Express app setup
│   ├── api/                   # API routes (organized by version & feature)
│   └── core/                  # Shared utilities, abstractions, config
├── build/                     # Compiled JavaScript (generated)
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── Dockerfile                # Container setup
├── docker-compose.yaml       # Local dev environment
└── nodemon.json             # Auto-reload configuration
```

## Deep Folder Breakdown

### `src/main.ts` – The Entry Point

```
main.ts
  ├── Initialize database connection
  ├── Start Express server
  └── Handle process-wide errors
```

The app won't start until the database is ready. Error handling is set up globally to prevent crashes.

---

### `src/app/` – Express Setup

```
app/
├── app.module.ts          # Creates the Express app instance
├── app.router.ts          # Mounts all API routes + Swagger docs
├── app.service.ts         # Middleware setup (CORS, file upload, etc.)
├── index.ts               # Exports everything
└── app-events/            # Event bus system
    ├── app.events.ts      # Event manager
    ├── event.types.ts     # Type definitions
    ├── events.register.ts # Event listeners
    └── index.ts
```

**Key Files:**

-   `app.module.ts` – Creates the Express app and returns it
-   `app.router.ts` – Registers all routes + Swagger UI
-   `app.service.ts` – Adds middleware (compression, CORS, file upload, etc.)
-   `app-events/` – Custom event bus for inter-module communication

---

### `src/api/v1/` – Routes & Controllers

```
api/v1/
├── auth/                   # Authentication routes
│   ├── router/
│   │   ├── auth.router.ts  # POST /auth/login, /auth/register, etc.
│   │   └── schema/         # Joi validation schemas
│   ├── services/           # Business logic
│   ├── repository/         # Database queries
│   ├── interface/          # TypeScript types
│   ├── utils/              # Helper functions
│   └── index.ts            # Exports
├── user/                   # User profile routes
├── gigs/                   # Gig routes
├── talents/                # Talent routes
├── employers/              # Employer routes
└── earnings/               # Earnings routes
```

**Naming Convention:**

-   `auth/router/auth.router.ts` – API routes for auth
-   `auth/services/login/index.ts` – Business logic for login
-   `auth/repository/` – Database queries
-   `auth/interface/` – Types/interfaces

---

### `src/core/` – Shared Infrastructure

```
core/
├── config/                 # Environment config
│   ├── config.ts          # Validates and exports env vars
│   ├── database.ts        # Supabase client
│   ├── cors.ts            # CORS configuration
│   └── ratelimiting.ts    # Rate limit config
├── errors/                # Custom error classes
│   ├── apiError.ts        # Base abstract error
│   ├── badRequestError.ts # 400 errors
│   ├── unAuthorizedError.ts # 401 errors
│   ├── forbiddenError.ts  # 403 errors
│   ├── notFoundError.ts   # 404 errors
│   └── ... (more error types)
├── handlers/              # HTTP request processing
│   ├── errorhandler.ts    # Catches and formats errors
│   ├── notFoundErrorHandler.ts
│   └── controlBuilder/    # THE KEY ABSTRACTION
│       ├── index.builder.ts    # ControlBuilder class
│       ├── index.handler.ts    # Request handler
│       ├── index.interface.ts  # Types
│       ├── index.utils.ts      # Helper functions
│       └── index.ts            # Exports
├── repository/            # Base data layer
│   ├── base.repository.ts # Reusable CRUD + Supabase methods
│   ├── types.ts          # Query types
│   └── index.ts
├── services/              # Base business logic
│   ├── baseService.ts    # Base class with Supabase client
│   ├── mails/            # Email service
│   ├── sms/              # SMS service
│   └── index.ts
├── types/                 # Shared TypeScript types
│   ├── common/           # Common types (pagination, etc.)
│   ├── global/           # Global types
│   └── index.ts
├── utils/                 # Utility functions
│   ├── statusCodes.ts    # HTTP status codes
│   ├── Joi.ts            # Joi validation helpers
│   ├── pagination.ts     # Pagination logic
│   ├── bcrypt.ts         # Password hashing
│   ├── misc.ts           # Miscellaneous helpers
│   └── index.ts
├── logging/               # Winston logger
│   ├── logs.ts           # Logger configuration
│   └── index.ts          # Exports
├── database/              # Database setup (ORM config, migrations)
│   ├── ormconfig.js
│   ├── migrations/
│   ├── seeders/
│   └── associations/
├── common/                # Static constants
│   ├── constants.ts       # API_SUFFIX, etc.
│   └── index.ts
└── index.ts               # Main export (re-exports everything)
```

**Important:** The `core/` folder is imported with the `@` alias. You can do:

```typescript
import { logger, config, BaseService, ControlBuilder } from '@/core';
```

---

## Quick Navigation

**If you need to...**

| Task                 | Location                                               |
| -------------------- | ------------------------------------------------------ |
| Add a new route      | `src/api/v1/{feature}/router/{feature}.router.ts`      |
| Add validation       | `src/api/v1/{feature}/router/schema/`                  |
| Write business logic | `src/api/v1/{feature}/services/`                       |
| Access database      | `src/api/v1/{feature}/repository/`                     |
| Define types         | `src/api/v1/{feature}/interface/` or `src/core/types/` |
| Change config        | `src/core/config/config.ts`                            |
| Handle errors        | `src/core/errors/`                                     |
| Log something        | Import `logger` from `@/core/logging`                  |
| Use Redis            | Redis initialized as cache, available in services      |

---

# 3. Code Organization Philosophy

## Four Pillars

### 1. **Separation of Concerns**

Each layer has a single job:

-   **Routers** – Parse requests, don't touch logic
-   **Services** – Pure business logic, no Express knowledge
-   **Repositories** – Database queries only
-   **Interfaces** – Type definitions

### 2. **Module Aliases for Clean Imports**

Instead of:

```typescript
import { logger } from '../../../../core/logging';
```

Use:

```typescript
import { logger } from '@/core/logging'; // @ = src/
import { authRouter } from '~/auth'; // ~ = src/api/v1/
```

See `tsconfig.json` for `baseUrl` and `paths`.

### 3. **Layered Architecture**

```
Request
  ↓
Router (validates, parses)
  ↓
ControlBuilder (auth, permissions)
  ↓
Service (business logic)
  ↓
Repository (database)
  ↓
Supabase
```

Each layer depends only on the layer below it.

### 4. **Feature-Based Organization**

Similar features live together:

```
auth/
  ├── router/
  ├── services/
  ├── repository/
  ├── interface/
  └── utils/
```

Not okay:

```
routes/
  ├── auth.ts
services/
  ├── auth.ts
```

---

## The ControlBuilder Pattern

This is the most important abstraction. It's a builder that:

1. **Parses** incoming requests
2. **Validates** input against schemas
3. **Authenticates** if the route is private
4. **Authorizes** based on roles/permissions
5. **Executes** the handler function
6. **Formats** the response

Example:

```typescript
authRouter.post(
    '/login',
    ControlBuilder.builder()
        .setValidator(loginSchema) // Validate request body
        .setHandler(login.handle) // Run this function
        .handle(), // Return middleware
);
```

For protected routes:

```typescript
userRouter.get(
    '/:id',
    ControlBuilder.builder()
        .isPrivate() // Requires auth token
        .only(Role.TALENT, Role.ADMIN) // Only these roles
        .setValidator(paramsSchema)
        .setHandler(getUserById.handle)
        .handle(),
);
```

---

# 4. Adding New Code (Top Layer Guide)

## Scenario: Add a New Endpoint

Let's say you need to add `GET /api/v1/gigs/:id/details`.

### Step 1: Create the Repository (Database Layer)

**File:** `src/api/v1/gigs/repository/gig.repository.ts`

```typescript
import { BaseRepository } from '@/core';
import { TableNames } from '@/core/repository';
import { Gig } from '../interface';

export class GigRepository extends BaseRepository<GigDB, Gig> {
    protected table = TableNames.GIGS;

    async findGigWithDetails(gigId: string) {
        const gig = await this.findById(gigId);
        // Add your custom queries here
        return gig;
    }
}

export const gigRepository = new GigRepository();
```

### Step 2: Create the Service (Business Logic)

**File:** `src/api/v1/gigs/services/get-gig-details/index.ts`

```typescript
import { BaseService, ControllerArgs, logger, NotFoundError } from '@/core';
import { gigRepository } from '../../repository/gig.repository';

export class GetGigDetails extends BaseService {
    handle = async ({ params }: ControllerArgs) => {
        const { id } = params;

        const gig = await gigRepository.findGigWithDetails(id);

        if (!gig) {
            throw new NotFoundError('Gig not found');
        }

        logger.info(`Fetched gig details: ${id}`);

        return {
            data: gig,
            message: 'Gig details retrieved successfully',
        };
    };
}

export default new GetGigDetails();
```

### Step 3: Create Validation Schema

**File:** `src/api/v1/gigs/router/schema/get-details.schema.ts`

```typescript
import { joiValidate } from '@/core';
import Joi from 'joi';

export const getGigDetailsSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};
```

### Step 4: Add the Route

**File:** `src/api/v1/gigs/router/gig.router.ts` (update existing)

```typescript
import { ControlBuilder } from '@/core';
import { Router } from 'express';
import getGigDetails from '../services/get-gig-details';
import { getGigDetailsSchema } from './schema';

export const gigRouter = Router();

gigRouter.get(
    '/:id/details',
    ControlBuilder.builder()
        .isPrivate() // Requires auth
        .setValidator(getGigDetailsSchema)
        .setHandler(getGigDetails.handle)
        .handle(),
);
```

### Step 5: Export from Feature Index

**File:** `src/api/v1/gigs/index.ts`

```typescript
export * from './router/gig.router';
```

### Step 6: Mount in Main Router (if new feature)

If you created a new feature (not just a new endpoint in existing feature), update:

**File:** `src/app/app.router.ts`

```typescript
import { gigRouter } from '~/gigs';

appRouter.use('/gig', gigRouter);
```

### Step 7: Test & Document

Add Swagger comments to your route:

```typescript
/**
 * @swagger
 * /gig/{id}/details:
 *   get:
 *     tags: [Gigs]
 *     summary: Get gig details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Gig details
 *       404:
 *         description: Gig not found
 */
```

---

## For Protected Routes

If only **Talents** should access an endpoint:

```typescript
gigRouter.post(
    '/:id/apply',
    ControlBuilder.builder()
        .only(Role.TALENT) // Only talents
        .setValidator(applySchema)
        .setHandler(applyToGig.handle)
        .handle(),
);
```

If you need **specific permissions**:

```typescript
gigRouter.delete('/:id', ControlBuilder.builder().isPrivate().requirePermissions(Permission.DELETE_GIG).setHandler(deleteGig.handle).handle());
```

If you need to check **resource ownership** (user can only modify their own resource):

```typescript
gigRouter.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .checkResourceOwnership(Resources.GIG, 'id', true) // Check user owns gig
        .setValidator(updateGigSchema)
        .setHandler(updateGig.handle)
        .handle(),
);
```

---

## File Naming Conventions

Follow these patterns:

| What       | File Name                 | Example              |
| ---------- | ------------------------- | -------------------- |
| Router     | `{feature}.router.ts`     | `auth.router.ts`     |
| Service    | `{action}/index.ts`       | `login/index.ts`     |
| Repository | `{feature}.repository.ts` | `auth.repository.ts` |
| Schema     | `{action}.schema.ts`      | `login.schema.ts`    |
| Interface  | `{feature}.interface.ts`  | `auth.interface.ts`  |
| Error      | `{errorType}Error.ts`     | `ValidationError.ts` |
| Utils      | `{name}.ts`               | `helpers.ts`         |

---

# 5. Internal Architecture (Deep Layer Guide)

## How Requests Flow Through the System

```
HTTP Request arrives
    ↓
Express RouterHandler
    ↓
ControlBuilder.builder()
    ├─ Parse incoming request
    ├─ Extract body, params, query, headers, files
    ├─ Check authentication (if isPrivate)
    │  └─ Verify JWT token with Supabase
    ├─ Check authorization (roles/permissions)
    │  ├─ Check allowed roles
    │  ├─ Verify specific permissions
    │  └─ Check resource ownership
    ├─ Validate request against schema
    │  └─ Joi validation
    ├─ Execute handler function
    │  └─ Service processes business logic
    └─ Format response as JSON
    ↓
Express Response sent back

If error occurs at ANY step:
    ↓
Error is caught
    ↓
ErrorHandler formats it
    ↓
ErrorHandler sends response
```

---

## Request Parsing: What Happens Inside?

The `parseIncomingRequest` function extracts:

```typescript
{
  input: req.body,           // JSON from request body
  params: req.params,        // URL path parameters
  query: req.query,          // Query string parameters
  headers: req.headers,      // HTTP headers
  user: req.user,            // Authenticated user (if logged in)
  files: req.files,          // Uploaded files
  request: req,              // Full Express request object
}
```

All of this is passed to your service handler as `ControllerArgs`.

---

## Authentication & Authorization Flow

### Authentication (Who Are You?)

```
User sends request with header:
Authorization: Bearer <JWT_TOKEN>
    ↓
ControlBuilder checks if route is private
    ↓
Extracts token from header
    ↓
Calls Supabase to verify token
    ↓
Supabase returns user data
    ↓
Query database for full user profile
    ↓
Attach user to req.user
```

### Authorization (What Can You Do?)

After authentication, check three things:

1. **Role-Based Access**

    ```typescript
    .only(Role.ADMIN)  // Only admins
    ```

    Checks if `user.role` is in allowed roles.

2. **Permission-Based Access**

    ```typescript
    .requirePermissions(Permission.DELETE_GIG)
    ```

    Queries permission table to see if user has permission.

3. **Resource Ownership**
    ```typescript
    .checkResourceOwnership(Resources.GIG, 'id')
    ```
    Verifies user owns the resource by ID.

---

## Data Layer: Repository Pattern

All database access goes through repositories. Here's why:

```typescript
// ❌ DON'T do this in services:
const { data } = await supabaseAdmin.from('gigs').select('*').eq('id', gigId);

// ✅ DO this instead:
class GigRepository extends BaseRepository {
    async findById(id) {
        /* reuses base method */
    }
}
```

### BaseRepository Methods (Reusable)

```typescript
// Find by ID
await repo.findById(id, fields?: string[])

// Find many with filtering
await repo.findMany({
    pagination: { page: 1, pageSize: 10 },
    filters: { status: 'active' },
    orderBy: { column: 'created_at', ascending: false }
})

// Create
await repo.create(data)

// Update by ID
await repo.updateById(id, updates)

// Delete by ID
await repo.deleteById(id)
```

### Casing Conversion

The database uses `snake_case`, but code uses `camelCase`. The repository handles this automatically:

```typescript
// Database row (snake_case)
{ gig_id: 123, created_at: '2024-01-01', is_active: true }

// Your code (camelCase)
{ gigId: 123, createdAt: '2024-01-01', isActive: true }
```

Methods like `mapToCamelCase()` and `mapToSnakeCase()` do the conversion.

---

## Error Handling: The Hierarchy

```
Error (JavaScript base)
    ↓
ApiError (abstract, Gigify custom)
    ├─ BadRequestError (400)
    ├─ UnAuthorizedError (401)
    ├─ ForbiddenError (403)
    ├─ NotFoundError (404)
    ├─ ConflictError (409)
    ├─ UnProcessableError (422)
    ├─ TooManyRequestsError (429)
    └─ ServerError (500)
```

All custom errors extend `ApiError`. Here's how:

```typescript
// Creating an error
throw new NotFoundError('User not found');

// The error contains:
{
    statusCode: 404,
    message: 'User not found',
    details: null // optional validation details
}

// When caught by ErrorHandler, response looks like:
{
    status: false,
    code: 404,
    message: 'User not found'
}
```

---

## Event Bus: Decoupled Communication

Instead of tightly coupling modules, use events:

```
Service A: "Hey, user was created!"
    ↓
Event Bus receives 'user:created' event
    ↓
All listeners for 'user:created' are called
    ├─ Send welcome email
    ├─ Create default preferences
    └─ Update analytics
```

### How to Use Events

**Dispatch an event:**

```typescript
import { dispatch } from '@/app';

// Send event
dispatch('user:created', { userId: user.id });

// Receive results from all listeners
const results = await dispatch('user:get-by-id', { id: userId });
```

**Listen for an event:**

```typescript
// In src/app/app-events/events.register.ts
bus.onEvent('user:created', async (data) => {
    console.log(`User ${data.userId} was created`);
    // Do something
});
```

Benefits:

-   Modules don't need to know about each other
-   Easy to add new features without modifying existing code
-   Failures in listeners don't crash the app

---

## Validation: Joi Schema Pattern

Validation happens at the boundary (request entry point).

```typescript
const schema = {
    inputSchema: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    }),
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    querySchema: Joi.object({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100),
    }),
};
```

If validation fails, `UnProcessableError` is thrown with details.

---

## Middleware Stack

Request goes through middleware in this order:

```
1. express.json()           – Parse JSON body
2. cookieParser()           – Parse cookies
3. fileUpload()             – Handle file uploads
4. cors()                   – Allow cross-origin
5. express.static()         – Serve static files
6. urlencoded()             – Parse form data
7. session()                – Session management
8. appRouter                – Your API routes
9. notFoundHandler          – 404 if route not found
10. errorHandler            – Catch all errors
```

The last two are error catchers. Everything that goes wrong gets caught there.

---

## How Types Work

### TypeScript Strict Mode

```typescript
// tsconfig.json
{
    "strict": true,
    "noImplicitAny": true
}
```

This means:

-   Every variable must have an explicit type
-   No `any` unless absolutely necessary
-   Function parameters must be typed

### Path Aliases

```typescript
// tsconfig.json
{
    "paths": {
        "@/*": ["*"],           // @ = src/
        "~/*": ["api/v1/*"]     // ~ = src/api/v1/
    }
}
```

This allows clean imports from anywhere:

```typescript
// Instead of:
import { logger } from '../../../core/logging';

// Write:
import { logger } from '@/core/logging';
```

---

# 6. Data Flow Explained

## A Complete User Registration Flow

```
Client sends POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123"
}
    ↓
authRouter catches /register
    ↓
ControlBuilder.builder()
    .setValidator(signUpSchema)     ← Validate email format, password strength
    .setHandler(register.handle)
    .handle()
    ↓
ValidationSchema runs:
    ├─ Check email is valid
    ├─ Check password is strong
    └─ If invalid: throw UnProcessableError
    ↓
register.handle() runs (Service layer)
    ├─ Normalize email to lowercase
    ├─ Call Supabase Auth to create user
    │  └─ On error: throw error (mapped to human-readable)
    ├─ User created in Supabase Auth system
    ├─ Create user record in database
    │  └─ Call userRepository.create()
    │     └─ Calls Supabase table API
    ├─ Return success response
    └─ Dispatch 'user:created' event
       ├─ Send welcome email
       ├─ Create preferences
       └─ Other listeners react
    ↓
Response sent to client:
{
  "status": true,
  "data": { user object },
  "message": "Registration successful"
}
```

---

## State Flow: How Data Moves

```
Client's Browser
    ↓
HTTP Request
    ↓
Express Router
    ↓
ControlBuilder parser
    {
        input: { email, password },
        headers: { ... },
        user: null (not logged in yet),
        ...
    }
    ↓
Validation (Joi)
    ↓
Service (Register)
    ├─ Calls baseService.supabase
    │  └─ Uses Supabase admin client
    └─ Returns: { data: ..., message: ... }
    ↓
Repository (if used)
    └─ Translates domain model ↔ database schema
    ↓
Supabase
    ├─ Auth system (JWT, user identity)
    └─ PostgreSQL database
    ↓
Response formatted
    ↓
Client receives JSON
```

---

## Database: Where Things Live

**Supabase Database Tables:**

-   `auth.users` – User accounts (managed by Supabase Auth)
-   `public.users` – User profiles in your database
-   `public.gigs` – Gig listings
-   `public.roles` – Role definitions
-   `public.permissions` – Permission definitions
-   etc.

**Caching (Redis):**

-   Session data
-   Temporary tokens
-   Cache busting

---

# 7. Dependency Rules

## What Can Import What?

### Golden Rule

```
API Routes (v1)
    ↓ (can import)
Services
    ↓
Repositories
    ↓
Core (shared)
    ↓
Node.js & npm packages
```

**The Other Way Is Forbidden:**

-   ❌ Core cannot import from specific routes
-   ❌ Repositories cannot import from services
-   ❌ Services cannot import from routers

### Import Paths by Layer

| Layer                                 | Can Import                            | Example                                                |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| **Router** (`~/auth/router/`)         | Services, Types, Core                 | `import { login } from '../services'`                  |
| **Service** (`~/auth/services/`)      | Repositories, Core, Types             | `import { authRepo } from '../repository'`             |
| **Repository** (`~/auth/repository/`) | Core, Types only                      | `import { BaseRepository } from '@/core'`              |
| **Core**                              | Only npm packages, other core modules | `import { createClient } from '@supabase/supabase-js'` |

---

## Why This Matters

This separation allows:

1. **Testing** – Mock repositories easily
2. **Reusability** – Services work with any router
3. **Maintainability** – Changes don't ripple everywhere
4. **Decoupling** – Modules don't depend on implementation details

---

## Module Aliases

Don't use relative imports like:

```typescript
// ❌ Bad
import { logger } from '../../../../core/logging';
import { BaseService } from '../../../../core/services';
```

Use aliases:

```typescript
// ✅ Good
import { logger, BaseService } from '@/core';
```

### Available Aliases

| Alias | Points To     | Use For           |
| ----- | ------------- | ----------------- |
| `@`   | `src/`        | Everything in src |
| `~`   | `src/api/v1/` | API routes        |

Defined in `tsconfig.json`:

```json
{
    "baseUrl": "src",
    "paths": {
        "@/*": ["*"],
        "~/*": ["api/v1/*"]
    }
}
```

---

# 8. Coding Standards & Conventions

## TypeScript

### Always Type Everything

```typescript
// ❌ Bad
const user = { name: 'John' };
const items = [];

// ✅ Good
interface User {
    name: string;
    email: string;
}

const user: User = { name: 'John', email: 'john@example.com' };
const items: string[] = [];
```

### Use Strict Mode

```typescript
// tsconfig.json includes strict mode
"strict": true
```

This means:

-   No implicit `any`
-   No null/undefined surprises
-   Stricter function types

---

## Naming Conventions

### Files & Directories

```
// kebab-case for files (with exceptions)
src/api/v1/auth/services/login/index.ts  ← All lowercase
src/api/v1/auth/router/schema/          ← Directories lowercase

// ✅ Service files
login/index.ts
register/index.ts
verify-email/index.ts

// ✅ Repository files
user.repository.ts
gig.repository.ts

// ✅ Schema files
login.schema.ts
register.schema.ts
```

### Variables & Functions

```typescript
// camelCase for variables and functions
const isUserActive = true;
const getUserById = async (id: string) => { ... };

// PascalCase for classes
class UserRepository { ... }
class LoginService { ... }
```

### Constants

```typescript
// UPPER_SNAKE_CASE for constants
const MAX_PAGE_SIZE = 100;
const DEFAULT_ROLE = 'TALENT';
```

### API Endpoints

```typescript
// kebab-case for URLs
POST /api/v1/auth/verify-email
GET /api/v1/users/:id
PATCH /api/v1/gigs/:id/details
```

---

## Error Handling

### Always Throw Custom Errors

```typescript
// ❌ Bad
if (!user) {
    throw new Error('User not found');
}

// ✅ Good
import { NotFoundError } from '@/core';

if (!user) {
    throw new NotFoundError('User not found');
}
```

### Appropriate Error Types

```typescript
import {
    BadRequestError, // 400
    UnAuthorizedError, // 401
    ForbiddenError, // 403
    NotFoundError, // 404
    ConflictError, // 409
    UnProcessableError, // 422
    TooManyRequestsError, // 429
    ServerError, // 500
} from '@/core';

if (!email || !password) {
    throw new BadRequestError('Email and password are required');
}

if (emailAlreadyExists) {
    throw new ConflictError('Email already registered');
}

if (userNotOwner) {
    throw new ForbiddenError('You do not have permission to modify this');
}
```

---

## Logging

### Use Winston Logger

```typescript
import { logger } from '@/core/logging';

// log different levels
logger.info('User logged in', { userId: user.id });
logger.error('Database query failed', { error });
logger.warn('Rate limit approaching', { remaining: 50 });
```

### When to Log

-   ✅ Important business events (user created, payment processed)
-   ✅ Errors (log the full error object)
-   ✅ Performance issues (slow queries)
-   ❌ Every variable assignment
-   ❌ Passwords, tokens, sensitive data

---

## Code Comments

### Write Comments For "Why", Not "What"

```typescript
// ❌ Bad – the code already says what it does
const user = await userRepository.findById(id); // Find user by ID

// ✅ Good – explains the intent
// User must exist before we can update profile preferences
const user = await userRepository.findById(id);
if (!user) throw new NotFoundError('User not found');
```

### Document Complex Logic

```typescript
// Complex: Use comments
// Order matters: Check permissions first, then ownership.
// A permission can bypass ownership checks if admin.
if (user.role !== 'ADMIN' && user.id !== resource.ownerId) {
    throw new ForbiddenError('Not authorized');
}

// Simple: No comment needed
const isActive = user.status === 'active';
```

---

## Code Formatting

Use ESLint and Prettier. Commands:

```bash
npm run lint:fix      # Fix linting issues
npm run prettier:fix  # Format code
npm run lint-prettier:fix  # Both
```

Commit hooks run these automatically (Husky).

---

# 9. Common Mistakes

## Mistake 1: Being Too Smart With Relative Imports

```typescript
// ❌ Hard to read, fragile
import { logger } from '../../../core/logging';
import { authRouter } from '../../api/v1/auth/router';

// ✅ Always clear where it comes from
import { logger } from '@/core/logging';
import { authRouter } from '~/auth';
```

---

## Mistake 2: Putting Business Logic in Routers

```typescript
// ❌ Router shouldn't do this
authRouter.post('/register', (req, res) => {
    const email = req.body.email.toLowerCase();
    // ... 50 lines of logic
    res.json({ ... });
});

// ✅ Router only parses, service does logic
authRouter.post(
    '/register',
    ControlBuilder.builder()
        .setHandler(register.handle)
        .handle()
);

// Service (business logic)
register.handle = async ({ input }) => {
    const email = input.email.toLowerCase();
    // ... logic here
};
```

---

## Mistake 3: Directly Querying Database in Services

```typescript
// ❌ Bad – service knows about Supabase
const { data } = await supabaseAdmin.from('users').select('*');

// ✅ Good – use repository
const users = await userRepository.findMany();
```

---

## Mistake 4: Not Validating Input

```typescript
// ❌ Bad – assuming input is correct
const { email, password } = req.body;
// ... later, email could be null

// ✅ Good – validate at boundary
const schema = {
    inputSchema: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    }),
};
```

---

## Mistake 5: Throwing Generic Errors

```typescript
// ❌ Bad – client doesn't know what's wrong
throw new Error('Something went wrong');

// ✅ Good – specific, actionable error
throw new UnAuthorizedError('Invalid email or password');
```

---

## Mistake 6: Mixing Authentication & Authorization

```typescript
// ❌ Confusing
.isPrivate()
.requirePermissions(Permission.EDIT_PROFILE)  // Is this 'private'?
.only(Role.ADMIN)  // What if user has permission but isn't admin?

// ✅ Clear intent
.isPrivate()                    // Requires authentication
.only(Role.ADMIN)               // Only admins
.requirePermissions(...)        // Admins must also have this permission
```

---

## Mistake 7: Not Handling Async Errors

```typescript
// ❌ Unhandled promise rejection
service.doSomething(); // Returns Promise

// ✅ Always await or .catch()
await service.doSomething();
// or
service.doSomething().catch((err) => {
    logger.error('Failed', err);
});
```

---

## Mistake 8: Blocking Operations in Request Handlers

```typescript
// ❌ Blocks the thread
const hash = bcrypt.hashSync(password);

// ✅ Non-blocking
const hash = await bcrypt.hash(password);
```

---

## Mistake 9: Not Casing Data Correctly

```typescript
// ❌ Mixing cases – confusing
const user = {
    userId: 123, // camelCase
    user_name: 'john', // snake_case
    UserEmail: 'john@...', // PascalCase
};

// ✅ Consistent
const user = {
    userId: 123,
    userName: 'john',
    userEmail: 'john@...',
};
```

---

## Mistake 10: Storing Secrets in Code

```typescript
// ❌ Never do this
const API_KEY = 'sk_live_abc123xyz';
const DB_PASSWORD = 'MySecretPassword';

// ✅ Use environment variables
import { config } from '@/core/config';
const apiKey = config.sendGrid.sendGridApikey;
```

---

# 10. Quick Contributor Checklist

When adding a new endpoint, go through this checklist:

### Before You Start

-   [ ] Understand what the endpoint should do (business logic)
-   [ ] Know what input it expects (body, params, query)
-   [ ] Know what it should return
-   [ ] Know if it should be public or require auth

### While Coding

**Database Layer:**

-   [ ] Create/update repository with query methods
-   [ ] Use BaseRepository for standard CRUD
-   [ ] Create custom methods for complex queries
-   [ ] Handle snake_case ↔ camelCase conversion

**Business Logic Layer:**

-   [ ] Create service class extending BaseService
-   [ ] Write the `handle` method
-   [ ] Use appropriate error types
-   [ ] Log important events
-   [ ] Throw errors, don't return them

**Validation Layer:**

-   [ ] Create Joi schema with all validations
-   [ ] Handle inputSchema, paramsSchema, querySchema
-   [ ] Make required fields `.required()`
-   [ ] Add helpful error messages

**API Layer:**

-   [ ] Create router file in feature folder
-   [ ] Use ControlBuilder for every route
-   [ ] Set `.isPrivate()` if authentication needed
-   [ ] Set `.only()` for role restrictions
-   [ ] Set `.requirePermissions()` for permission checks
-   [ ] Set `.checkResourceOwnership()` if needed
-   [ ] Add Swagger documentation comments

**Types:**

-   [ ] Define interfaces for request/response
-   [ ] Define types for database models
-   [ ] Use TypeScript strict mode (no `any`)

**Testing & Cleanup:**

-   [ ] Build the project: `npm run build`
-   [ ] Check for errors: `npm run lint:check`
-   [ ] Format code: `npm run prettier:fix`
-   [ ] Test the endpoint manually or with tests
-   [ ] Verify error responses are correct
-   [ ] Verify authentication/authorization works

### Code Review Checklist

-   [ ] Code follows naming conventions
-   [ ] No relative imports (use `@` and `~`)
-   [ ] Error handling is appropriate
-   [ ] All inputs are validated
-   [ ] No secrets in code
-   [ ] Logging is meaningful
-   [ ] Comments explain "why", not "what"
-   [ ] Database queries use repository pattern
-   [ ] No business logic in routers
-   [ ] Types are explicit (no `any`)

---

## Quick Scripts

```bash
# Start development
npm run start:dev

# Build for production
npm run build

# Run in production
npm run start:prod

# Lint
npm run lint:fix

# Format code
npm run prettier:fix

# Both
npm run lint-prettier:fix

# Check without fixing
npm run lint:check
npm run prettier:check

# Database migrations
npm run migration:generate -- --name create_users
npm run db:migrate

# See all scripts
cat package.json | grep scripts
```

---

## Directory Template

When creating a new feature, use this template:

```
api/v1/newfeature/
├── router/
│   ├── newfeature.router.ts
│   └── schema/
│       ├── action1.schema.ts
│       └── action2.schema.ts
├── services/
│   ├── action1/
│   │   └── index.ts
│   └── action2/
│       └── index.ts
├── repository/
│   ├── newfeature.repository.ts
│   └── index.ts
├── interface/
│   └── newfeature.interface.ts
├── utils/
│   └── index.ts
└── index.ts
```

---

# Final Tips

1. **Read existing code first.** Look at auth or user modules to see the pattern.
2. **Use the event bus for decoupling.** Don't call services directly if possible.
3. **Keep services pure.** They shouldn't know about HTTP.
4. **Test boundary logic.** Validation and auth are critical.
5. **Log strategically.** Important events, errors, not everything.
6. **Document your routes.** Swagger comments help others.
7. **Ask if stuck.** The codebase isn't perfect, and questions improve it.

---

## Need Help?

-   **Architecture question?** Look at `src/core/handlers/controlBuilder/`
-   **Error handling?** Look at `src/core/errors/`
-   **Database query?** Look at `src/core/repository/`
-   **Example endpoint?** Look at `src/api/v1/auth/`
-   **Configuration?** Look at `src/core/config/`

---

**Happy coding!** 🚀

This guide is meant to be friendly and practical. If something is unclear, that's feedback for improvement. Contribute, ask questions, and help others understand the system better.
