# Gigify Backend

REST API for the Gigify marketplace, built on Express.js + TypeScript + Supabase. This README is the architecture deep-dive. For getting set up, the contribution workflow, and contribution recipes, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Table of contents

1. [Overview](#1-overview)
2. [Folder structure](#2-folder-structure)
3. [Architecture](#3-architecture)
4. [Request lifecycle](#4-request-lifecycle)
5. [Conventions](#5-conventions)

---

## 1. Overview

Gigify is a marketplace for music talents (DJs, drummers, vocalists) and the employers who book them. The backend exposes a versioned REST API at `/api/v1/*` plus Supabase Realtime broadcast channels for chat and notifications.

| Layer       | Tech                                                                            |
| ----------- | ------------------------------------------------------------------------------- |
| Runtime     | Node.js 20, Express 4.18                                                        |
| Language    | TypeScript 5 (strict)                                                           |
| Database    | Supabase (PostgreSQL + Auth + Storage + Realtime)                               |
| Cache       | Redis (`ioredis`, lazy-connect)                                                 |
| Validation  | Joi                                                                             |
| Email / SMS | Resend / Twilio                                                                 |
| Payments    | Stripe                                                                          |
| KYC         | Sumsub                                                                          |
| API docs    | Swagger at `/api/v1/api-docs`                                                   |
| Tests       | Jest (runs on compiled JS in `build/`)                                          |
| Tooling     | ESLint + Prettier + Husky pre-commit, pnpm v9 package manager                   |
| CI/CD       | GitHub Actions (Supabase staging migrations + Fly.io app deploy on `develop`)   |

The companion frontend lives in a separate Next.js repo. The FE's `server/apiTypes/*.type.ts` files are the authoritative wire-format contract.

---

## 2. Folder structure

```
src/
├── main.ts                  # Entry. Boots the DB connection then starts the HTTP server.
├── app/                     # Express setup
│   ├── app.module.ts        # Builds the Express app
│   ├── app.router.ts        # Mounts every module's router + Swagger UI
│   ├── app-cache/           # Redis client
│   └── app-events/          # Typed event bus (cross-module communication)
├── api/v1/                  # All HTTP endpoints, one folder per feature
│   ├── auth/  user/  gigs/  talents/  employers/
│   ├── chat/  earnings/  notifications/  realtime/
│   ├── upload/  admin/
└── core/                    # Shared infrastructure
    ├── config/              # Env validation (Joi), Supabase + Redis clients
    ├── handlers/            # ControlBuilder + global error handler
    ├── repository/          # BaseRepository (auto snake_case ↔ camelCase)
    ├── errors/              # Typed error classes (BadRequestError, etc.)
    ├── services/            # Mail, SMS, audit, realtime broadcast
    ├── types/common/        # Auto-generated Supabase types. DO NOT EDIT.
    └── utils/               # Pagination, image upload, bcrypt, misc
```

### Module template

Every folder under `src/api/v1/` follows this layout:

```
{module}/
├── interfaces/
│   ├── controller.payload.ts   # Request DTOs extending ControllerArgsTypes
│   └── module.types.ts         # Domain types (Gig, User, etc.)
├── repository/
│   └── {name}.repository.ts    # Supabase queries, extends BaseRepository
├── router/
│   ├── {name}.router.ts        # Express Router + Swagger JSDoc + ControlBuilder
│   └── schema/index.ts         # Joi schemas
├── services/
│   ├── {actionName}/
│   │   ├── index.ts            # Service class + singleton export
│   │   └── index.spec.ts       # Jest tests
│   └── index.ts
└── listeners.ts                # (optional) event-bus subscribers
```

### Path aliases

```ts
import { config } from '@/core';                  // @ → src/
import { GigRepository } from '~/gigs/repository'; // ~ → src/api/v1/
```

Configured in `tsconfig.json` (compile), `package.json._moduleAliases` (runtime), and `jest.config.cjs` (tests). Change all three together.

---

## 3. Architecture

### Layered design

```
HTTP request
    ↓
Router (parses URL, mounts middleware)
    ↓
ControlBuilder (auth, validation, role/permission checks)
    ↓
Service (business logic)
    ↓
Repository (Supabase queries, type mapping)
    ↓
Supabase
```

Each layer depends only on the layer below. Routers don't run business logic. Services don't know about HTTP. Repositories don't know about events.

### ControlBuilder

Every route is composed through a fluent builder:

```ts
gigRouter.post(
    '/',
    ControlBuilder.builder()
        .setValidator(createGigSchema)   // Joi schema { inputSchema?, paramsSchema?, querySchema? }
        .setHandler(createGig.handle)    // service method
        .only('employer')                // role gate (auto-marks private)
        .handle(),                       // returns Express middleware
);
```

| Method                                  | Effect                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `.setHandler(fn)`                       | The service function to execute                                          |
| `.setValidator(schema)`                 | Joi schema applied to body / params / query                              |
| `.isPrivate()`                          | Require a valid bearer token                                             |
| `.only(...roles)`                       | Restrict to roles (`'talent'`, `'employer'`, `'admin'`)                  |
| `.requirePermissions(...permissions)`   | Granular permission check                                                |
| `.checkResourceOwnership(resource, p)`  | Verify the authenticated user owns the resource named by URL param `p`   |
| `.handle()`                             | Build and return the Express middleware                                  |

The handler receives a typed `ControllerArgs<TDto>` with `{ input, params, query, request, files, headers }`.

### Service pattern

Services are classes with a single `handle` method, instantiated as singletons. Dependencies come in via constructor, which makes them easy to mock in tests.

```ts
export class CreateGig {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ input, request }: ControllerArgs<CreateGigDto>) => {
        // ...
        return { code: HttpStatus.CREATED, message: 'Gig Created Successfully', data: gig };
    };
}

const createGig = new CreateGig(new GigRepository());
export default createGig;
```

### Repository pattern (snake_case ↔ camelCase)

The DB uses `snake_case`, the API returns `camelCase`. `BaseRepository` handles the conversion automatically:

```ts
// DB row
{ gig_id: '…', created_at: '…', is_active: true }

// What your service sees
{ gigId: '…', createdAt: '…', isActive: true }
```

Inherited helpers: `findById`, `findMany({ pagination, filters, orderBy })`, `updateById`, `mapToCamelCase`, `mapToSnakeCase`.

For columns whose camelCase form doesn't follow the auto-conversion (e.g. `location_name` is exposed as `venueName`), override `mapToCamelCase` and `mapToSnakeCase` in the specific repo. See `GigRepository` for the canonical example.

### Event bus

Cross-module communication goes through `AppEventManager` instead of direct imports:

```ts
import { dispatch } from '@/app';

const [user] = await dispatch('user:get-by-id', { id: userId });
```

Listeners are registered in `src/app/app-events/events.register.ts`. Event types live in `event.types.ts`. Add new events there first.

This keeps modules loosely coupled. `gigs/` doesn't import from `notifications/`; it just emits an event the notifications module subscribes to.

### Realtime

Supabase Realtime broadcast (not Postgres Changes). Two channel patterns:

| Channel                    | Event              | Use                       |
| -------------------------- | ------------------ | ------------------------- |
| `user:{userId}`            | `new_notification` | Personal notifications    |
| `conversation:{convoId}`   | `new_message`      | Chat                      |

The backend publishes via `realtimeService.broadcastTo*`. The frontend subscribes via Supabase JS client using credentials from `GET /realtime/config`.

### Error hierarchy

All thrown errors extend `ApiError`:

```
ApiError (abstract)
├── BadRequestError       (400)
├── UnAuthorizedError     (401)
├── ForbiddenError        (403)
├── RouteNotFoundError    (404)
├── ConflictError         (409)
├── UnProcessableError    (422)
├── TooManyRequestsError  (429)
└── ServerError           (500)
```

The global error handler in `core/handlers/errorhandler.ts` maps each to a JSON response:

```json
{ "status": false, "code": 404, "message": "Gig not found" }
```

Always throw a typed error. Never `res.status(...).send(...)` from a service.

### Storage buckets

Created via Supabase Dashboard (or admin SDK), not migrations. Current set:

| Bucket       | Limit  | Mime types              | Notes                                    |
| ------------ | ------ | ----------------------- | ---------------------------------------- |
| `avatars`    | 5 MB   | images                  | profile avatars                          |
| `media`      | 100 MB | images / video / PDF    | general uploads                          |
| `portfolios` | 50 MB  | images / video / PDF    | talent portfolio assets                  |
| `IDUpload`   | 20 MB  | images / PDF            | KYC / identity verification, public-read |

The upload route (`POST /upload?bucket=…&folder=…`) is generic; pass the bucket name as a query param.

---

## 4. Request lifecycle

A complete `POST /api/v1/auth/register` round-trip:

```
1. Client posts { email, password }
        ↓
2. authRouter matches /register, hands off to ControlBuilder middleware
        ↓
3. ControlBuilder
       ├─ parseIncomingRequest      → { input, params, query, headers, files, request }
       ├─ validateIncomingRequest   → Joi runs the schema; throws UnProcessableError on miss
       └─ (no auth, public route)
        ↓
4. register.handle(args) (service layer)
       ├─ Normalize email
       ├─ Call Supabase auth.admin.createUser
       ├─ Insert public.users row via UserRepository
       └─ dispatch('user:created', {userId})    ← decoupled side effects
        ↓
5. Listeners react asynchronously
       ├─ Welcome email (Resend)
       ├─ Default notification preferences
       └─ Audit log
        ↓
6. Response { status: true, data, message } sent to client
```

If anything throws, the global error handler catches it, logs via Winston, and returns the right HTTP status + error envelope.

### Middleware order (`src/app/app.module.ts`)

1. `express.json()`: parse JSON body
2. `cookieParser()`: parse cookies
3. `fileUpload()`: handle multipart uploads
4. `cors()`: CORS policy from `core/config/cors.ts`
5. `express.static()`: serve static files
6. `urlencoded()`: form-encoded bodies
7. `session()`: session middleware (used by OAuth flows)
8. `appRouter`: your API
9. `notFoundErrorHandler`: 404 catch-all
10. `errorhandler`: final error formatter

### Authentication

When `.isPrivate()` is set:

1. Bearer token extracted from `Authorization` header
2. Token checked against the Redis blacklist (logout invalidations)
3. `supabaseAdmin.auth.getUser(token)` validates the token and returns the auth user
4. `dispatch('user:get-by-id', { id })` loads the public.users profile
5. The hydrated user is attached to `req.user` and passed to the service

If `.only(...)` is set, the user's `role` is checked against the allowed list. If `.checkResourceOwnership(...)` is set, ownership is verified via the resource module's repository.

---

## 5. Conventions

### TypeScript

- `strict: true`, `noImplicitAny: true`. Don't reach for `any`. Use `unknown` and narrow, or `as never` only for test mock injection.
- Service classes take dependencies via constructor; export singletons.
- DTOs live in `interfaces/controller.payload.ts` and extend `ControllerArgsTypes`.

### Casing

| Where                             | Convention                                                                  |
| --------------------------------- | --------------------------------------------------------------------------- |
| Database columns                  | `snake_case` (`first_name`, `created_at`)                                   |
| API request / response fields     | `camelCase` (`firstName`, `createdAt`)                                      |
| Variables, functions              | `camelCase`                                                                 |
| Classes, types, interfaces        | `PascalCase`                                                                |
| Constants                         | `UPPER_SNAKE_CASE`                                                          |
| URLs                              | `kebab-case` (`/auth/verify-email`, `/gig/my-gigs/{status}`)                |

### Comments

Default to no comments. Only add one when the **why** is non-obvious: a hidden constraint, a workaround, surprising behaviour, or a domain invariant.

```ts
// ❌ Don't paraphrase the code
const offset = (page - 1) * pageSize; // calculate offset

// ✅ Only when the why isn't obvious
// `equipment_provided` was the inverse of FE's `isEquipmentRequired`,
// flipped during the column rename in 20260508. Keeping a comment so
// the migration's intent isn't lost on the reader.
```

### Error handling

Always throw a typed error from `@/core`:

```ts
import { BadRequestError, RouteNotFoundError, ConflictError } from '@/core';

if (!params.id) throw new BadRequestError('Gig ID is required');
if (!gig) throw new RouteNotFoundError('Gig not found');
if (existing) throw new ConflictError('Email already registered');
```

### Comms failures must not block

Email and SMS calls are wrapped in try/catch. A Resend or Twilio outage should never fail a primary operation:

```ts
try {
    await mailService.send(welcomeOnboardingMail({ firstName }));
} catch (error) {
    logger.error('welcome email failed', { userId, error: String(error) });
}
```

### Module aliases over relative imports

```ts
// ❌
import { logger } from '../../../../core/logging';

// ✅
import { logger } from '@/core';
```

### Computed vs stored fields

Some fields look like columns but are derived:

| Field                                | Source                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `users.onboarded`                    | Computed from `onboardingStep >= 3`. Never written directly.               |
| `talent.totalGigsCompleted`          | Aggregated query on `gig_applications` joined to `gigs.status='completed'` |
| `employer.totalApplicationsReceived` | Aggregated query on `gig_applications` joined to `gigs.employer_id`        |

The frontend writes `onboardingStep`. The backend exposes `onboarded` for reads only.

---

## Where to look next

- **Contribution workflow + recipes**: see [CONTRIBUTING.md](./CONTRIBUTING.md)
- **A clean end-to-end module example**: `src/api/v1/employers/services/getEmployerGigs/`
- **The auth flow in detail**: `src/api/v1/auth/services/{login,register,exchangeGoogleAuthCode}/`
- **Config + env validation**: `src/core/config/config.ts`
- **Live API surface**: boot the dev server and open `http://localhost:8000/api/v1/api-docs`
