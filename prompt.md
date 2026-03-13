# Gigify Backend — Implementation Prompt

> **Purpose**: This document gives you everything you need to continue building the Gigify backend. You have access to the Figma file showing the app's screens and flows. Your job is to implement the backend APIs, services, and logic that power every screen in that Figma file, following the exact patterns, conventions, and architecture established in this codebase.

---

## Table of Contents

1. [Project Context](#1-project-context)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Folder Structure & Conventions](#4-folder-structure--conventions)
5. [Path Aliases](#5-path-aliases)
6. [The ControlBuilder Pattern (CRITICAL)](#6-the-controlbuilder-pattern-critical)
7. [How to Create a New Feature Module](#7-how-to-create-a-new-feature-module)
8. [Database Schema (Supabase)](#8-database-schema-supabase)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Event System](#10-event-system)
11. [Email & SMS Services](#11-email--sms-services)
12. [File Uploads](#12-file-uploads)
13. [Caching (Redis)](#13-caching-redis)
14. [Pagination](#14-pagination)
15. [Error Handling](#15-error-handling)
16. [Logging](#16-logging)
17. [Swagger Documentation](#17-swagger-documentation)
18. [What's Already Implemented](#18-whats-already-implemented)
19. [What's Missing / Needs Implementation](#19-whats-missing--needs-implementation)
20. [Known Bugs to Fix](#20-known-bugs-to-fix)
21. [Environment Variables](#21-environment-variables)
22. [How to Connect Routes to the App](#22-how-to-connect-routes-to-the-app)
23. [Code Examples (Copy These Patterns)](#23-code-examples-copy-these-patterns)
24. [Rules & Constraints](#24-rules--constraints)
25. [When to Ask for Clarification](#25-when-to-ask-for-clarification)

---

## 1. Project Context

**Gigify** is a gig economy platform connecting **Talents** (performers, musicians, DJs, etc.) with **Employers** (event organizers, venues, etc.). Think of it like a specialized marketplace for live entertainment gigs.

**Three user roles exist:**

| Role       | Description                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `talent`   | Performers who browse and apply for gigs, manage portfolios, receive payouts |
| `employer` | People/companies who post gigs, hire talent, and make payments               |
| `admin`    | Platform administrators who manage users, moderate content, view audit logs  |

**The backend is a REST API** built with Express.js + TypeScript, using Supabase (PostgreSQL) as the database and auth provider.

---

## 2. Tech Stack

| Layer        | Technology                         | Usage                |
| ------------ | ---------------------------------- | -------------------- |
| Runtime      | Node.js 20                         | Server runtime       |
| Framework    | Express.js 4.18                    | HTTP server          |
| Language     | TypeScript 5 (strict mode)         | Type safety          |
| Database     | Supabase (PostgreSQL)              | Data storage + Auth  |
| Cache        | Redis (ioredis 5.4)                | Caching layer        |
| Validation   | Joi 17.9                           | Request validation   |
| Email        | Nodemailer + SendGrid              | Transactional emails |
| SMS          | Twilio                             | Text messages        |
| Logging      | Winston 3.10                       | Structured logging   |
| File Upload  | express-fileupload                 | Multipart uploads    |
| File Storage | Supabase Storage                   | Image/video storage  |
| API Docs     | swagger-jsdoc + swagger-ui-express | Interactive API docs |
| Deployment   | Fly.io (Docker)                    | Production hosting   |
| Dev          | nodemon + docker-compose           | Local development    |

---

## 3. Architecture Overview

```
HTTP Request
  ↓
Express Middleware (CORS, JSON parsing, file upload, sessions)
  ↓
Router (route matching)
  ↓
ControlBuilder Pipeline:
  1. Authentication (extract Bearer token → verify via Supabase → fetch user from DB)
  2. Authorization (check role, check permissions, check resource ownership)
  3. Validation (Joi schemas for params, query, body, files)
  4. Handler Execution (service business logic)
  5. Response Formatting ({ code, message, data })
  ↓
Global Error Handler (catches all errors, formats response)
```

### Layer Responsibilities

| Layer          | Responsibility                                   | Location                             |
| -------------- | ------------------------------------------------ | ------------------------------------ |
| **Router**     | Define HTTP routes, attach ControlBuilder chains | `src/api/v1/{module}/router/`        |
| **Schema**     | Joi validation schemas for request data          | `src/api/v1/{module}/router/schema/` |
| **Service**    | Business logic, orchestration                    | `src/api/v1/{module}/services/`      |
| **Repository** | Database queries via Supabase client             | `src/api/v1/{module}/repository/`    |
| **Interface**  | TypeScript types, DTOs, enums                    | `src/api/v1/{module}/interfaces/`    |
| **Utils**      | Module-specific helper functions                 | `src/api/v1/{module}/utils/`         |

### Data Flow Direction

```
Router → Service → Repository → Supabase
                                    ↓
Router ← Service ← Repository ← Response
```

Each layer depends ONLY on the layer below it. Never skip layers.

---

## 4. Folder Structure & Conventions

### Feature Module Structure

Every API feature module follows this EXACT structure:

```
src/api/v1/{module}/
├── router/
│   ├── {module}.router.ts       # Express Router with ControlBuilder chains
│   └── schema/
│       └── index.ts             # Joi validation schemas
├── services/
│   ├── {action}/
│   │   └── index.ts             # Service class with handle method
│   └── index.ts                 # Barrel export of all services
├── repository/
│   ├── {module}.repository.ts   # Repository extending BaseRepository
│   └── index.ts                 # Barrel export
├── interfaces/
│   ├── module.types.ts          # Domain types (User, Talent, Gig, etc.)
│   ├── controller.payload.ts    # ControllerArgs payload DTOs
│   └── index.ts                 # Barrel export
├── utils/                       # (optional) Module-specific helpers
│   └── index.ts
├── listeners.ts                 # (optional) Event listeners for this module
└── index.ts                     # Barrel: exports the router
```

### Naming Conventions

-   **Files**: `camelCase.ts` for services, `kebab-case.ts` or `camelCase.ts` for utils
-   **Classes**: `PascalCase` (e.g., `GetUserById`, `UserRepository`)
-   **Variables/functions**: `camelCase`
-   **Database columns**: `snake_case` (Supabase convention)
-   **Domain model fields**: `camelCase` (converted by `mapToCamelCase`)
-   **Router files**: `{module}.router.ts`
-   **Service folders**: named by action (e.g., `getUserById/`, `createGig/`)

### Barrel Exports

Every directory has an `index.ts` that re-exports everything:

```typescript
// src/api/v1/gigs/index.ts
export * from './router/gig.router';
```

---

## 5. Path Aliases

Defined in `tsconfig.json` and `package.json` (`_moduleAliases`):

| Alias | Resolves To    | Usage                                                                 |
| ----- | -------------- | --------------------------------------------------------------------- |
| `@/*` | `src/*`        | Core imports: `import { logger } from '@/core'`                       |
| `~/*` | `src/api/v1/*` | Feature imports: `import { UserRepository } from '~/user/repository'` |

**Examples:**

```typescript
import { BaseService, ControllerArgs, HttpStatus, logger } from '@/core';
import { dispatch } from '@/app';
import { UserRepository } from '~/user/repository';
import { TalentRepository } from '~/talents/repository';
```

---

## 6. The ControlBuilder Pattern (CRITICAL)

This is the **most important abstraction** in the codebase. Every route MUST use it.

### Basic Usage

```typescript
import { ControlBuilder } from '@/core';

// Public route with validation
router.get('/items', ControlBuilder.builder().setValidator(querySchema).setHandler(getAllItems.handle).handle());

// Private route (requires auth token)
router.get('/:id', ControlBuilder.builder().isPrivate().setValidator(paramsSchema).setHandler(getItemById.handle).handle());

// Role-restricted route
router.post(
    '/',
    ControlBuilder.builder()
        .isPrivate()
        .only('employer') // Only employers can access
        .setValidator(createSchema)
        .setHandler(createItem.handle)
        .handle(),
);

// Route with resource ownership check (prevents IDOR)
router.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(updateSchema)
        .setHandler(updateItem.handle)
        .checkResourceOwnership('gig', 'id') // Checks user owns this gig
        .handle(),
);

// Route with permission requirements
router.delete(
    '/:id',
    ControlBuilder.builder().isPrivate().requirePermissions(Permission.GIG_DELETE).setValidator(paramsSchema).setHandler(deleteItem.handle).handle(),
);
```

### ControlBuilder API

| Method                                               | Purpose                                          |
| ---------------------------------------------------- | ------------------------------------------------ |
| `.builder()`                                         | Static — creates new instance                    |
| `.setHandler(fn)`                                    | Sets the business logic function                 |
| `.setValidator(schema)`                              | Sets Joi validation schema                       |
| `.isPrivate()`                                       | Requires Bearer token authentication             |
| `.only(...roles)`                                    | Restricts to specific roles (auto-sets private)  |
| `.requirePermissions(...perms)`                      | Checks fine-grained permissions                  |
| `.checkResourceOwnership(type, param, adminBypass?)` | Verifies user owns the resource                  |
| `.handle()`                                          | Returns Express middleware — MUST be called last |

### What Happens Inside `.handle()`

1. If `isPrivate`: extracts Bearer token → verifies with Supabase → fetches user from DB via event → checks roles → checks permissions → checks ownership
2. Parses request into `ControllerArgs`: `{ input, params, query, user, files, headers, request }`
3. Validates against Joi schemas (throws `UnProcessableError` on failure)
4. Calls the handler function with `ControllerArgs`
5. Takes the returned `{ code, message, data }` and sends HTTP response
6. If handler returns nothing: sends `{ status: true }` with 200

---

## 7. How to Create a New Feature Module

### Step 1: Define Types (`interfaces/module.types.ts`)

```typescript
import { DatabaseTable } from '@/core/types';

// Map to the Supabase-generated type for the DB row
export type DatabaseGig = DatabaseTable['gigs']['Row'];

// Domain model (camelCase fields)
export type Gig = {
    id: string;
    employerId: string;
    title: string;
    description: string | null;
    budgetAmount: number;
    currency: string | null;
    gigDate: string;
    status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
    serviceId: string | null;
    locationName: string | null;
    isRemote: boolean | null;
    createdAt: string | null;
    updatedAt: string | null;
};
```

### Step 2: Define Payload DTOs (`interfaces/controller.payload.ts`)

```typescript
import type { ControllerArgsTypes } from '@/core';

export interface CreateGigDto extends ControllerArgsTypes {
    input: {
        title: string;
        description?: string;
        budgetAmount: number;
        serviceId?: string;
        gigDate: string;
        locationName?: string;
        isRemote?: boolean;
    };
}

export interface GetGigParamsDto extends ControllerArgsTypes {
    params: { id: string };
}

export interface GetGigsQueryDto extends ControllerArgsTypes {
    query: {
        page?: number;
        pageSize?: number;
        status?: string;
        serviceId?: string;
    };
}
```

### Step 3: Create Repository (`repository/{module}.repository.ts`)

```typescript
import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseGig, Gig } from '../interfaces';

export class GigRepository extends BaseRepository<DatabaseGig, Gig> {
    protected readonly table = 'gigs';

    async findByEmployerId(employerId: string): Promise<Gig[]> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('employer_id', employerId);

        if (error) throw error;
        return data?.map(this.mapToCamelCase) ?? [];
    }

    async createGig(employerId: string, input: Partial<Gig>): Promise<Gig> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                employer_id: employerId,
                title: input.title!,
                description: input.description,
                budget_amount: input.budgetAmount!,
                gig_date: input.gigDate!,
                service_id: input.serviceId,
                location_name: input.locationName,
                is_remote: input.isRemote,
                status: 'open',
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapToCamelCase(data);
    }
}
```

**IMPORTANT**: The `BaseRepository` provides:

-   `findById(id, fields?)` — find one row by UUID
-   `findMany({ filters, pagination, orderBy, fields })` — paginated listing with filters
-   `updateById(id, updates)` — update and return updated row
-   `mapToCamelCase(row)` — converts DB `snake_case` row to `camelCase` domain object
-   `mapToSnakeCase(obj)` — converts `camelCase` object to `snake_case` for DB writes
-   `toSnakeCase(field)` — converts a single field name

### Step 4: Create Service (`services/{action}/index.ts`)

```typescript
import { BadRequestError, BaseService, ControllerArgs, HttpStatus, logger } from '@/core';
import { CreateGigDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class CreateGig extends BaseService {
    constructor(private readonly gigRepository: GigRepository) {
        super();
    }

    handle = async ({ input, user }: ControllerArgs<CreateGigDto>) => {
        if (!input) throw new BadRequestError('Gig data is required');
        if (!user?.id) throw new BadRequestError('User not found');

        const gig = await this.gigRepository.createGig(user.id, input);

        logger.info('Gig created', { gigId: gig.id, employerId: user.id });

        return {
            code: HttpStatus.CREATED,
            message: 'Gig created successfully',
            data: gig,
        };
    };
}

const createGig = new CreateGig(new GigRepository());
export default createGig;
```

**Service pattern rules:**

-   Class extends `BaseService` (gives access to `this.supabase`)
-   Constructor injects repositories
-   `handle` is an arrow function (preserves `this` context)
-   Takes `ControllerArgs<PayloadDTO>` as parameter — destructure what you need
-   Returns `{ code: HttpStatus.*, message: string, data?: any }`
-   Use `logger` for meaningful logs
-   Throw custom errors from `@/core` (BadRequestError, ConflictError, etc.)

### Step 5: Create Validation Schema (`router/schema/index.ts`)

```typescript
import Joi from 'joi';

export const createGigSchema = {
    inputSchema: Joi.object({
        title: Joi.string().min(3).max(200).required(),
        description: Joi.string().max(2000).optional(),
        budgetAmount: Joi.number().positive().required(),
        serviceId: Joi.string().uuid().optional(),
        gigDate: Joi.string().isoDate().required(),
        locationName: Joi.string().max(200).optional(),
        isRemote: Joi.boolean().optional(),
    }),
};

export const getGigParamsSchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};

export const getGigsQuerySchema = {
    querySchema: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string().valid('draft', 'open', 'in_progress', 'completed', 'cancelled').optional(),
        serviceId: Joi.string().uuid().optional(),
    }),
};
```

**Schema keys match what ControlBuilder validates:**

-   `inputSchema` → validates `req.body`
-   `paramsSchema` → validates `req.params`
-   `querySchema` → validates `req.query`
-   `fileSchema` → validates `req.files`

### Step 6: Create Router (`router/{module}.router.ts`)

```typescript
import { ControlBuilder } from '@/core';
import { Router } from 'express';
import { createGig, getGigById, getAllGigs } from '../services';
import { createGigSchema, getGigParamsSchema, getGigsQuerySchema } from './schema';

export const gigRouter = Router();

gigRouter
    .post('/', ControlBuilder.builder().isPrivate().only('employer').setValidator(createGigSchema).setHandler(createGig.handle).handle())
    .get('/:id', ControlBuilder.builder().setValidator(getGigParamsSchema).setHandler(getGigById.handle).handle())
    .get('/', ControlBuilder.builder().setValidator(getGigsQuerySchema).setHandler(getAllGigs.handle).handle());
```

### Step 7: Register the Router

In `src/app/app.router.ts`, import and mount:

```typescript
import { gigRouter } from '@/api/v1/gigs';
appRouter.use('/gig', gigRouter);
```

Also add the swagger `apis` glob to include the new module:

```typescript
apis: ['./src/api/v1/**/*.ts'],  // scan all modules
```

---

## 8. Database Schema (Supabase)

The database is managed through **Supabase** (hosted PostgreSQL). Types are auto-generated via `npm run generate-types` and stored in `src/core/types/common/database.interface.ts`.

### Existing Tables

| Table               | Description                     | Key Columns                                                                                                                                                             |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`             | All user accounts               | id (UUID, PK), email, first_name, last_name, role (enum), status (enum), phone_number, profile_image_url, location_city, location_country, onboarding_step, is_verified |
| `talent_profiles`   | Extended profile for talents    | id, user_id (FK→users), date_of_birth, skills (JSON[]), stage_name, biography, min_rate, max_rate, rate_currency, primary_role, banner_url, years_experience            |
| `talent_portfolios` | Portfolio media items           | id, talent_id (FK→talent_profiles), portfolio_url, view_count, deleted_at                                                                                               |
| `talent_reviews`    | Reviews of talents              | id, talent_id (FK→users), reviewer_id (FK→users), gig_id (FK→gigs), rating (number), comment                                                                            |
| `talent_services`   | Services a talent offers        | talent_id (FK→users), service_id (FK→services_catalog), years_experience                                                                                                |
| `employer_profiles` | Extended profile for employers  | id, user_id (FK→users), organization_name, company_website, industry, total_gigs_posted, total_spent                                                                    |
| `gigs`              | Gig postings                    | id, employer_id (FK→users), title, description, budget_amount, currency, gig_date, status (enum), service_id (FK→services_catalog), location_name, is_remote            |
| `services_catalog`  | Master list of service types    | id, name, category, icon_url, is_active                                                                                                                                 |
| `activities`        | User activity timeline          | id, user_id (FK→users), event_type (enum), reference_id, metadata (JSON)                                                                                                |
| `audit_logs`        | Security audit trail            | id, user_id (FK→users), action, resource_type, resource_id, changes (JSON), result (enum), ip_address, user_agent                                                       |
| `role_permissions`  | Permission assignments per role | id, role (enum), permission (string)                                                                                                                                    |
| `waitlist_users`    | Pre-launch waitlist             | id, email, first_name, last_name, location                                                                                                                              |

### Enums

```typescript
activity_type: 'user_joined' |
    'gig_posted' |
    'gig_applied' |
    'gig_started' |
    'gig_completed' |
    'payment_received' |
    'payout_requested' |
    'review_posted';
audit_result: 'success' | 'failure';
gig_status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
user_role: 'talent' | 'employer' | 'admin';
user_status: 'active' | 'suspended';
```

### Database Functions (RPCs)

```sql
get_talent_avg_rating(tid: string) → number
get_talent_rating_summary_full(tid: string) → { count: number, rating: number }[]
```

### Tables That May Need to Be Created

Depending on the Figma designs, you may need tables for:

-   **gig_applications** — talent applies to a gig (talent_id, gig_id, status, cover_message, applied_at)
-   **transactions / payments** — payment records between employers and talents
-   **payouts** — talent withdrawal requests
-   **notifications** — push/email notification records
-   **conversations / messages** — in-app messaging between talent and employer
-   **bookmarks / saved_gigs** — users saving gigs for later

**When you need a new table**: Create it in Supabase (SQL editor), then run `npm run generate-types` to update `database.interface.ts`. Ask me for Supabase access if needed.

---

## 9. Authentication & Authorization

### Authentication Flow

1. **Registration**: `POST /auth/register` → Supabase creates auth user → app creates `users` row with just id + email
2. **Email Verification**: Supabase sends OTP to email → `POST /auth/verify-email` with `{ email, otp }` → Supabase verifies → returns session tokens
3. **Role Setting**: `POST /auth/set-role` with `{ userId, role }` → updates `users.role` → if talent, dispatches `talent:create-talent` event (creates `talent_profiles` row)
4. **Login**: `POST /auth/login` with `{ email, password }` → Supabase returns JWT tokens
5. **Token Refresh**: `POST /auth/refresh-token` with `{ refreshToken }`
6. **Logout**: `POST /auth/logout`

### How Private Routes Work

When a route uses `.isPrivate()`:

1. Extract `Authorization: Bearer <token>` header
2. Call `supabaseAdmin.auth.getUser(token)` to verify the JWT
3. Dispatch `user:get-by-id` event to fetch the full user profile from the `users` table (NOT from Supabase auth metadata — this was a bug that's been fixed)
4. Attach user to `req.user`
5. Check `allowedRoles` if `.only(...)` was used
6. Check `requiredPermissions` if `.requirePermissions(...)` was used
7. Check `checkResourceOwnership` if `.checkResourceOwnership(...)` was used

### Permission System

Permissions are defined in `src/api/v1/auth/interface/module.types.ts`:

```typescript
enum Permission {
    USER_CREATE = 'user:create',
    USER_READ = 'user:read',
    USER_UPDATE = 'user:update',
    USER_DELETE = 'user:delete',
    GIG_CREATE = 'gig:create',
    GIG_READ = 'gig:read',
    GIG_UPDATE = 'gig:update',
    GIG_DELETE = 'gig:delete',
    GIG_VIEW_ALL = 'gig:view:all',
    PAYOUT_REQUEST = 'payout:request',
    PAYMENT_PROCESS = 'payment:process',
    VIEW_EARNINGS = 'view:earnings',
    REVIEW_CREATE = 'review:create',
    REVIEW_READ = 'review:read',
    REVIEW_DELETE = 'review:delete',
    REVIEW_MODERATE = 'review:moderate',
    SUSPEND_USER = 'suspend:user',
    VIEW_AUDIT_LOGS = 'view:audit:logs',
}
```

Role-to-permission mapping (hardcoded fallback if DB `role_permissions` table is empty):

```typescript
const rolePermissions = {
    talent: [USER_READ, USER_UPDATE, GIG_CREATE, GIG_READ, GIG_UPDATE, PAYOUT_REQUEST, REVIEW_CREATE, REVIEW_READ, VIEW_EARNINGS],
    employer: [USER_READ, USER_UPDATE, GIG_CREATE, GIG_READ, GIG_UPDATE, PAYMENT_PROCESS, REVIEW_CREATE, REVIEW_READ],
    admin: [
        /* all permissions */
    ],
};
```

### Resource Ownership

The `ResourceRepository` in `src/api/v1/auth/repository/resource.repository.ts` maps resource types to tables:

```typescript
const tableMap = {
    user: { table: 'users', ownerColumn: 'id' },
    gig: { table: 'gigs', ownerColumn: 'user_id' },
    review: { table: 'talent_reviews', ownerColumn: 'user_id' },
    payment: { table: 'users', ownerColumn: 'user_id' },
    talent: { table: 'talent_profiles', ownerColumn: 'user_id' },
};
```

**When adding new resource types** (e.g., `employer_profile`, `gig_application`), update this map and the `Resources` type.

---

## 10. Event System

The app uses a custom typed event bus for cross-module communication (`src/app/app-events/`).

### Existing Events

| Event                       | Data              | Returns                 | Used For                                         |
| --------------------------- | ----------------- | ----------------------- | ------------------------------------------------ |
| `app:up`                    | void              | void                    | Log server started                               |
| `user:get-by-id`            | `{ id, fields? }` | `Partial<User> \| null` | Auth middleware fetches user profile             |
| `talent:create-talent`      | `{ user_id }`     | `Talent \| null`        | Create talent profile on role set                |
| `talent:get-talent-profile` | `{ user_id }`     | `TalentProfile \| null` | Fetch full talent profile with reviews/portfolio |

### How to Use Events

**Dispatching:**

```typescript
import { dispatch } from '@/app';

// Returns array of results from all listeners
const [user] = await dispatch('user:get-by-id', { id: userId });
```

**Registering a listener** (in `src/app/app-events/events.register.ts`):

```typescript
bus.onEvent('your:event-name', yourListenerFunction);
```

**Adding a new event type** (in `src/app/app-events/event.types.ts`):

```typescript
interface AppEventsInterface {
    // ... existing events
    'employer:create-profile': EventDefinition<{ user_id: string }, EmployerProfile | null>;
}
```

### When to Use Events

-   **Cross-module communication**: When module A needs data from module B but shouldn't import B directly
-   **Side effects**: When an action should trigger something in another module (e.g., creating talent profile after role set)
-   **NOT for**: Intra-module calls (just import the repository/service directly)

---

## 11. Email & SMS Services

### Sending Email

```typescript
import { sendEmail } from '@/core/services/mails/mail.service';

await sendEmail({
    to: 'user@example.com',
    subject: 'Welcome to Gigify!',
    body: '<h1>Welcome</h1><p>Your account is ready.</p>',
});
```

Uses **SendGrid** via nodemailer. The sender address comes from `config.sendGrid.sendgrid_email`.

**Currently, Supabase handles the OTP/verification emails automatically**. Use the `sendEmail` service for:

-   Welcome emails after onboarding
-   Gig application notifications
-   Payment/payout confirmations
-   Custom transactional emails

### Sending SMS

```typescript
import { sendSMS } from '@/core/services/sms/sms.service';

await sendSMS({
    phoneNumber: '+1234567890',
    body: 'Your Gigify verification code is 123456',
});
```

Uses **Twilio**. The sender number comes from `config.twilio.twilio_phone_number`.

---

## 12. File Uploads

### Image Upload Service

```typescript
import { imageUploadService } from '@/core';

const { publicUrl, path, mimeType, size } = await imageUploadService.upload(file, {
    bucket: 'avatars', // Supabase storage bucket name
    folder: 'profiles', // Subfolder within bucket
    userId: user.id, // Used in file path
    maxSizeMB: 50, // Max file size
    allowedMimeTypes: ['image/*'], // MIME filter
});

// Bulk upload
const results = await imageUploadService.bulkUpload(filesArray, options);

// Delete
await imageUploadService.delete('avatars', ['path/to/file.jpg']);
```

**Storage path format**: `{folder}/{userId}/{randomUUID}.{ext}`

The `files` object is available in controller args when a request contains multipart form data:

```typescript
handle = async ({ files, user }: ControllerArgs) => {
    if (files?.profileImage) {
        const image = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage;
        // upload image...
    }
};
```

---

## 13. Caching (Redis)

```typescript
import { cache } from '@/app/app-cache';

// Write (stores JSON stringified)
await cache.set('key', JSON.stringify(data), 'EX', 3600); // 1 hour TTL

// Read
const data = await cache.read<MyType>('key'); // Parses JSON, returns T | null

// Check existence
const exists = await cache.has('key');

// Delete
await cache.remove('key');
```

---

## 14. Pagination

```typescript
import { normalizePagination } from '@/core/utils/pagination';

// Input: query params from request
const { page, pageSize, offset, limit, rangeEnd } = normalizePagination(
    { page: query.page, pageSize: query.pageSize },
    { defaultPageSize: 20, maxPageSize: 100 },
);

// Use with Supabase
const { data } = await supabaseAdmin.from('gigs').select('*').range(offset, rangeEnd).order('created_at', { ascending: false });
```

Defaults: page=1, pageSize=20, max=100.

---

## 15. Error Handling

### Available Error Classes

| Error Class            | HTTP Code | When to Use                                     |
| ---------------------- | --------- | ----------------------------------------------- |
| `BadRequestError`      | 400       | Invalid input, missing required fields          |
| `UnAuthorizedError`    | 401       | Not authenticated, invalid/expired token        |
| `ForbiddenError`       | 403       | Authenticated but lacks permission              |
| `RouteNotFoundError`   | 404       | Resource doesn't exist                          |
| `ConflictError`        | 409       | Duplicate resource (e.g., email already exists) |
| `UnProcessableError`   | 422       | Validation failed (auto-thrown by Joi)          |
| `TooManyRequestsError` | 429       | Rate limit exceeded                             |
| `ServerError`          | 500       | Unexpected internal error                       |

### Usage

```typescript
import { BadRequestError, ConflictError, ForbiddenError } from '@/core';

if (!user) throw new BadRequestError('User not found');
if (existing) throw new ConflictError('Email already registered');
if (!isOwner) throw new ForbiddenError('You cannot access this resource');
```

All thrown errors are caught by the global `ErrorHandler` in `src/core/handlers/errorhandler.ts`, which formats the response as:

```json
{ "status": false, "code": 400, "message": "User not found" }
```

---

## 16. Logging

```typescript
import { logger } from '@/core';

logger.info('Gig created', { gigId: gig.id, userId: user.id });
logger.error('Failed to create gig', { error: error.message });
logger.warn('Deprecated API called', { path: req.path });
```

Winston is configured with:

-   **Development**: Console transport with colors
-   **Production**: File transports (`info.log`, `error.log`)

---

## 17. Swagger Documentation

Add JSDoc swagger comments above each route in the router file. Follow this exact format:

```typescript
/**
 * @swagger
 * /gig:
 *   post:
 *     tags: [Gigs]
 *     summary: Create a new gig posting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - budgetAmount
 *               - gigDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budgetAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Gig created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', ControlBuilder.builder()...);
```

**Important**: The swagger `apis` glob in `app.router.ts` needs to include all router files. Currently it only scans `./src/api/v1/auth/**/*.ts`. Change it to: `./src/api/v1/**/*.ts` to auto-discover all routes.

---

## 18. What's Already Implemented

### Auth Module ✅ (Fully Working)

-   `POST /auth/login` — Email/password login via Supabase
-   `POST /auth/register` — Registration via Supabase + creates `users` row
-   `POST /auth/set-role` — Set user role (talent/employer), creates talent_profile if talent
-   `POST /auth/verify-email` — OTP verification via Supabase
-   `POST /auth/verify-email/resend` — Resend verification email
-   `POST /auth/refresh-token` — Refresh JWT tokens
-   `POST /auth/logout` — Sign out via Supabase admin

### User Module ✅ (Partially Working — Routes Commented Out in app.router.ts)

-   `GET /user/:id` — Get user by ID (supports `?full_profile=true` for talent profile)
-   `GET /user` — List users with pagination, role filter, search
-   `PATCH /user/:id` — Update user profile (with image upload + resource ownership check)
-   `DELETE /user/:id` — Soft delete user

### Talent Module 🟡 (Services Exist but Router is Empty)

-   `updateTalentById` service — Updates talent profile fields
-   `getAllTalentPortfolios` service — Get a talent's portfolio items
-   `uploadTalentPortfolios` service — Upload images/videos to portfolio
-   `deleteTalentPortfolio` service — Delete portfolio item
-   `createTalentReview` service — Create a review for a talent
-   `getAllTalentReviews` service — Get all reviews with rating summary
-   Event listeners: `createTalentEventListener`, `getTalentProfileByUserId`

### Permission/Resource System ✅ (Framework in Place)

-   `PermissionRepository` — Check role permissions
-   `ResourceRepository` — Verify resource ownership
-   `checkPermissions` util
-   `verifyResourceOwnership` util
-   ControlBuilder supports `.requirePermissions()` and `.checkResourceOwnership()`

### Core Infrastructure ✅

-   Error handling hierarchy
-   ControlBuilder pipeline
-   BaseRepository with CRUD + case conversion
-   BaseService with Supabase client
-   Event bus system
-   Email service (SendGrid)
-   SMS service (Twilio)
-   File upload service (Supabase Storage)
-   Redis cache
-   Winston logging
-   Rate limiting
-   Pagination utility

---

## 19. What's Missing / Needs Implementation

Look at the Figma file for the exact screens and flows. Below is what likely needs to be built based on the codebase gaps:

### Gigs Module (Highest Priority)

-   **Gig CRUD**: Create, read, update, delete gigs
-   **Gig Search/Explore**: Search with filters (location, service type, budget range, date)
-   **Gig Catalog**: List service categories from `services_catalog` table
-   **Gig Applications**: Talents apply for gigs, employers review applications
-   **Gig Lifecycle**: draft → open → in_progress → completed/cancelled
-   **Hire Talent**: Employer selects a talent for a gig
-   **My Gigs**: Talent views their applied/upcoming/active/completed gigs
-   Routes are defined with Swagger stubs in `src/api/v1/user/router/gig.router.ts` but have NO handlers

### Employer Module

-   **Employer Profile CRUD**: Create/update employer profile (organization name, website, industry)
-   Similar pattern to talent profiles — create on role set
-   Employer dashboard data

### Earnings Module

-   **View Earnings**: Talent's earnings breakdown
-   **Payout Requests**: Talent requests withdrawal
-   **Payment Processing**: Record payments from employers

### Activities/Timeline

-   **User Activity Timeline**: Log and retrieve user activities
-   Uses `activities` table with `activity_type` enum
-   Need to dispatch activity creation events at appropriate points (gig posted, applied, completed, etc.)

### Notifications

-   **Notification Preferences**: `PATCH /user/settings/notifications` (route exists, no handler)
-   Push notifications / email notifications for gig updates, payments, etc.

### Identity Verification / Onboarding

-   **Liveness Check**: `POST /user/onboarding/liveness` (route exists, no handler)
-   Upload ID document / selfie for verification
-   Onboarding step tracking (users.onboarding_step)

### Audit Logging

-   `audit_logs` table exists in DB
-   Need service to create audit entries for security-critical actions
-   Admin route to view audit logs

### Talent Router

-   The talent services exist but the router (`src/api/v1/talents/router/talent.router.ts`) is **empty**
-   Need to wire up all talent services to routes with proper ControlBuilder chains

### Forgot Password / Reset Password

-   Auth services are commented out in `src/api/v1/auth/services/index.ts`
-   Need to implement or uncomment and complete

### Uncomment Existing Routes

-   In `src/app/app.router.ts`, `/user` and `/gig` routes are commented out
-   Need to uncomment them once the handlers are ready

---

## 20. Known Bugs to Fix

### 1. Copy-Paste Errors in User Router

In `src/api/v1/user/router/user.router.ts`, these routes incorrectly use `deleteUserById.handle`:

```typescript
// BUG: Should be a review creation handler, not deleteUserById
.post('/reviews', ControlBuilder.builder().isPrivate().setHandler(deleteUserById.handle).handle())

// BUG: Should be a timeline handler, not deleteUserById
.get('/me/timeline', ControlBuilder.builder().isPrivate().setHandler(deleteUserById.handle).handle())

// BUG: Should be a get reviews handler, not deleteUserById
.get('/:id/reviews', ControlBuilder.builder().setHandler(deleteUserById.handle).handle())
```

Fix these by creating proper service handlers and pointing the routes to them.

### 2. Role Check Case Sensitivity

In `src/core/handlers/controlBuilder/index.utils.ts`, the role comparison uses `.toLocaleUpperCase()`:

```typescript
const isRequestAuthorized = options.allowedRoles?.includes(user.role.toLocaleUpperCase() as UserRoleEnum);
```

But the `UserRoleEnum` values are lowercase (`'talent'`, `'employer'`, `'admin'`). This means `.only('talent')` will NEVER match because it compares `'TALENT'` with `'talent'`. **Fix**: remove the `.toLocaleUpperCase()` call.

### 3. Swagger API Scanning

In `src/app/app.router.ts`, swagger only scans auth routes:

```typescript
apis: ['./src/api/v1/auth/**/*.ts'],
```

Change to scan all routes: `apis: ['./src/api/v1/**/*.ts']`

### 4. Gig Router Location

The gig router is currently inside the user module (`src/api/v1/user/router/gig.router.ts`). It should be moved to its own module at `src/api/v1/gigs/router/gig.router.ts` following the feature-based organization principle.

---

## 21. Environment Variables

Required `.env` variables (see `src/core/config/config.ts` for Joi validation):

```env
NODE_ENV=development          # development | production | staging
PORT=8000                     # Server port

# Supabase
SUPABASE_URL=                 # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=    # Service role key (admin access)
SUPABASE_ANON_KEY=            # Anonymous key (public access)

# Redis
REDIS_HOST=                   # Redis host
REDIS_PORT=                   # Redis port (default 6379)
REDIS_PASSWORD=               # Redis password

# SendGrid (Email)
SENDGRID_API_KEY=             # SendGrid API key
SENDGRID_EMAIL=               # Sender email address

# Twilio (SMS)
TWILIO_SID=                   # Twilio Account SID
TWILIO_AUTH_TOKEN=            # Twilio Auth Token
TWILIO_PHONE_NUMBER=          # Twilio sender phone number
```

---

## 22. How to Connect Routes to the App

In `src/app/app.router.ts`:

```typescript
import { authRouter } from '@/api/v1/auth';
import { userRouter } from '@/api/v1/user';
import { gigRouter } from '@/api/v1/gigs';
import { talentRouter } from '@/api/v1/talents';
import { employerRouter } from '@/api/v1/employers';
import { earningsRouter } from '@/api/v1/earnings';

appRouter.use('/auth', authRouter);
appRouter.use('/user', userRouter); // Currently commented out — uncomment when ready
appRouter.use('/gig', gigRouter); // Currently commented out — uncomment when ready
appRouter.use('/talent', talentRouter); // New — add this
appRouter.use('/employer', employerRouter); // New — add this
appRouter.use('/earnings', earningsRouter); // New — add this
```

All routes are prefixed with `/api/v1` via the middleware in `app.service.ts`.

---

## 23. Code Examples (Copy These Patterns)

### Complete Service Example (with repository injection)

```typescript
// src/api/v1/gigs/services/getGigById/index.ts
import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { GetGigParamsDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class GetGigById {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params }: ControllerArgs<GetGigParamsDto>) => {
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const gig = await this.gigRepository.findById(params.id);

        if (!gig) throw new BadRequestError('Gig not found');

        return {
            code: HttpStatus.OK,
            message: 'Gig fetched successfully',
            data: this.gigRepository.mapToCamelCase(gig),
        };
    };
}

const getGigById = new GetGigById(new GigRepository());
export default getGigById;
```

### Complete Repository Example

```typescript
// src/api/v1/gigs/repository/gig.repository.ts
import { BaseRepository, supabaseAdmin, BadRequestError } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseGig, Gig } from '../interfaces';

export class GigRepository extends BaseRepository<DatabaseGig, Gig> {
    protected readonly table = 'gigs';

    async getAllGigs(query: {
        page?: number | string;
        pageSize?: number | string;
        status?: string;
        serviceId?: string;
        search?: string;
    }): Promise<Gig[]> {
        const { offset, rangeEnd } = normalizePagination({
            page: query.page,
            pageSize: query.pageSize,
        });

        let request = supabaseAdmin.from('gigs').select('*');

        if (query.status) request = request.eq('status', query.status);
        if (query.serviceId) request = request.eq('service_id', query.serviceId);
        if (query.search) {
            const s = `%${query.search}%`;
            request = request.or(`title.ilike.${s},description.ilike.${s}`);
        }

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw new Error(error.message);

        return data?.map(this.mapToCamelCase) ?? [];
    }

    async deleteGig(gigId: string): Promise<null> {
        const gig = await this.findById(gigId);
        if (!gig) throw new BadRequestError('Gig not found');

        const { error } = await supabaseAdmin.from('gigs').delete().eq('id', gigId);
        if (error) throw new Error(error.message);

        return null;
    }
}
```

### Event Listener Example

```typescript
// src/api/v1/employers/listeners.ts
import { EmployerProfile } from './interfaces';
import { EmployerRepository } from './repository';

export async function createEmployerProfileListener(user_id: string): Promise<EmployerProfile | null> {
    const employerRepository = new EmployerRepository();
    const profile = await employerRepository.createEmployerProfile(user_id);
    return profile;
}
```

Then register in `src/app/app-events/events.register.ts`:

```typescript
bus.onEvent('employer:create-profile', createEmployerProfileListener);
```

And add the type in `src/app/app-events/event.types.ts`:

```typescript
'employer:create-profile': EventDefinition<{ user_id: string }, EmployerProfile | null>;
```

---

## 24. Rules & Constraints

### DO

-   ✅ Follow the feature-module folder structure exactly
-   ✅ Use ControlBuilder for EVERY route
-   ✅ Create Joi validation schemas for all request inputs
-   ✅ Use `BaseRepository` and `BaseService` base classes
-   ✅ Use `mapToCamelCase` when returning data from repositories
-   ✅ Use `mapToSnakeCase` when writing data to Supabase
-   ✅ Add Swagger JSDoc comments to every route
-   ✅ Use barrel exports (index.ts) in every directory
-   ✅ Use path aliases (`@/` and `~/`) for all imports
-   ✅ Throw appropriate error classes from `@/core`
-   ✅ Log meaningful messages with `logger`
-   ✅ Use `.isPrivate()` on routes that need authentication
-   ✅ Use `.checkResourceOwnership()` on state-changing routes (update, delete)
-   ✅ Add `.requirePermissions()` where fine-grained access control is needed
-   ✅ Return `{ code: HttpStatus.*, message: string, data?: any }` from handlers

### DON'T

-   ❌ Don't use `res.send()` or `res.json()` directly in services — return data, let ControlBuilder handle the response
-   ❌ Don't import Express `req`/`res` in services — use `ControllerArgs`
-   ❌ Don't skip validation — always add schemas
-   ❌ Don't access `supabaseAdmin` directly in services — use repositories
-   ❌ Don't create routes without Swagger docs
-   ❌ Don't hardcode strings — use constants and enums
-   ❌ Don't put business logic in routers — keep them thin
-   ❌ Don't cross-import between feature modules — use the event bus instead
-   ❌ Don't forget to register new routers in `app.router.ts`

---

## 25. When to Ask for Clarification

Ask me if:

-   **You need new Supabase tables created** — I'll create them and regenerate types
-   **You're unsure about a business rule** from the Figma (e.g., "Can an employer cancel a gig that's in progress?")
-   **You need Supabase RPC functions** (stored procedures for complex queries)
-   **Payment integration details** — Stripe/Paystack specifics, webhook handling
-   **Notification delivery** — Push notification service (Firebase? OneSignal?)
-   **You need access to environment variables or secrets**
-   **The Figma shows a feature not covered in this document**
-   **You're unsure about database schema decisions** (e.g., should this be a separate table or a JSON column?)
-   **Email template content/design** — what should the welcome email say?
-   **Rate limiting specifics** — which routes need tighter limits?
-   **Anything about the mobile app's expected behavior** that affects API design

---

## Quick Reference Card

```
New Feature Checklist:
  1. [ ] interfaces/module.types.ts     — Domain types
  2. [ ] interfaces/controller.payload.ts — DTO types
  3. [ ] interfaces/index.ts             — Barrel export
  4. [ ] repository/{name}.repository.ts — DB queries
  5. [ ] repository/index.ts             — Barrel export
  6. [ ] services/{action}/index.ts      — Business logic (one per action)
  7. [ ] services/index.ts               — Barrel export
  8. [ ] router/schema/index.ts          — Joi validation schemas
  9. [ ] router/{name}.router.ts         — Routes with ControlBuilder + Swagger
  10. [ ] index.ts                        — Module barrel (exports router)
  11. [ ] Register router in app.router.ts
  12. [ ] Add event types if cross-module communication needed
  13. [ ] Register event listeners if applicable
```
