# Contributing to Gigify Backend

This guide gets you from clone to merged PR. It assumes you've cloned the repo and are joining the team. For the deeper architecture write-up, read [README.md](./README.md); this file focuses on workflow.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Project structure](#2-project-structure)
3. [Getting started](#3-getting-started)
4. [Running locally](#4-running-locally)
5. [Code style & conventions](#5-code-style--conventions)
6. [How to contribute (workflow)](#6-how-to-contribute-workflow)
7. [Contribution recipes](#7-contribution-recipes)
   - [Adding a new route / endpoint](#71-adding-a-new-route--endpoint)
   - [Updating an existing service](#72-updating-an-existing-service)
   - [Creating a new repository](#73-creating-a-new-repository)
   - [Adding a new feature module](#74-adding-a-new-feature-module)
   - [Fixing a bug](#75-fixing-a-bug)
   - [Writing tests](#76-writing-tests)
   - [Updating documentation](#77-updating-documentation)
8. [Useful commands](#8-useful-commands)

---

## 1. Project overview

Gigify is a marketplace for music talents (DJs, drummers, vocalists, …) and the employers who book them. The backend is a versioned REST API at `/api/v1/*`, plus Supabase Realtime broadcast channels for live notifications and chat.

**Stack:**

| Layer            | Tech                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| Runtime          | Node.js 20, Express 4                                                 |
| Language         | TypeScript (strict, ES2021, compiles to CommonJS)                     |
| Database         | Supabase (PostgreSQL + Auth + Storage + Realtime)                     |
| Cache            | Redis (ioredis, lazy-connect)                                         |
| Email            | Resend                                                                |
| SMS              | Twilio                                                                |
| Payments         | Stripe                                                                |
| KYC              | Sumsub                                                                |
| File upload      | `express-fileupload` → Supabase Storage                               |
| API docs         | Swagger (`swagger-jsdoc`) at `/api/v1/api-docs`                       |
| Tests            | Jest (runs on compiled JS in `build/`)                                |
| Lint / format    | ESLint + Prettier, enforced via Husky pre-commit                      |
| CI/CD            | GitHub Actions → migrations to Supabase staging, app deploys to Fly.io |
| Package manager  | **pnpm v9** (don't use npm/yarn; there's no `package-lock.json`)      |

The frontend lives in a separate repo (Next.js 16). When in doubt about field names, the FE's `server/apiTypes/*.type.ts` is the authoritative shape contract.

---

## 2. Project structure

```
src/
├── main.ts                  # Entry point. Boots DB connection then HTTP server.
├── app/                     # Express setup, app router, event bus, cache
│   ├── app.module.ts
│   ├── app.router.ts        # Mounts every module router
│   ├── app-cache/           # Redis client (resilient lazy-connect)
│   └── app-events/          # AppEventManager + typed event registry
├── api/v1/                  # All HTTP endpoints, one folder per feature
│   ├── auth/
│   ├── user/
│   ├── gigs/
│   ├── talents/
│   ├── employers/
│   ├── chat/
│   ├── earnings/
│   ├── notifications/
│   ├── realtime/
│   ├── upload/
│   └── admin/
└── core/                    # Shared infrastructure
    ├── config/              # Env validation (Joi), Supabase client, CORS, rate limits
    ├── handlers/            # ControlBuilder + global error handler
    ├── repository/          # BaseRepository (snake_case ↔ camelCase mapping)
    ├── errors/              # Typed error classes (BadRequestError, etc.)
    ├── services/            # Mail, SMS, audit, realtime broadcast
    ├── types/common/        # Auto-generated Supabase types. Do NOT edit by hand.
    ├── utils/               # Pagination, image upload, bcrypt, misc
    └── logging/             # Winston

supabase/
├── migrations/              # SQL migrations, numeric-prefix versioned
└── seeds/                   # Seed data SQL

scripts/
├── smoke-tests.sh           # Curl harness covering every ticket's endpoints
└── …

src/scripts/seed/            # TypeScript seed runner (built + executed by `pnpm seed`)
src/scripts/test-bootstrap.ts # Provisions QA users for the smoke harness
```

### Module layout (every folder under `src/api/v1/`)

```
{module}/
├── index.ts                  # Re-exports the router
├── interfaces/               # Domain types + DTOs (some older modules use `interface/` singular, which is fine; new ones use plural)
│   ├── controller.payload.ts # Request DTOs extending ControllerArgsTypes
│   ├── module.types.ts       # Domain types (Gig, User, …)
│   └── index.ts
├── repository/
│   ├── {name}.repository.ts  # Supabase queries, extends BaseRepository
│   └── index.ts
├── router/
│   ├── {name}.router.ts      # Express Router + Swagger JSDoc + ControlBuilder
│   └── schema/
│       └── index.ts          # All Joi schemas for this module
├── services/
│   ├── {serviceName}/
│   │   ├── index.ts          # Service class + singleton export
│   │   └── index.spec.ts     # Jest tests (optional but expected)
│   └── index.ts              # Re-exports every service
└── listeners.ts              # Event-bus listeners (only when needed)
```

### Path aliases

```ts
import { config } from '@/core';      // @ → src/
import { GigRepository } from '~/gigs/repository'; // ~ → src/api/v1/
```

Configured in:
- `tsconfig.json` (compile-time)
- `package.json` `_moduleAliases` (runtime via `module-alias/register`)
- `jest.config.cjs` `moduleNameMapper` (tests)

If you change the alias paths, update **all three**.

---

## 3. Getting started

### Prerequisites

- Node.js 20 (use `nvm` if you have multiple versions)
- pnpm v9 (`npm i -g pnpm`)
- Redis running locally (`brew install redis`, then `redis-server --daemonize yes`)
- A Supabase project (use the staging credentials team-share, or `supabase init` for a local stack)

### Install

```bash
git clone git@github.com:The-Gigify-Limited/Gigify-backend.git
cd Gigify-backend
pnpm install
```

### Environment

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Minimum required keys to get the server up:

```
PORT=8000
NODE_ENV=development
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

Other keys (Resend, Twilio, Stripe, Sumsub, etc.) are listed in `.env.example`. Most local dev paths don't need them; the corresponding services no-op or fail soft.

### Database

Migrations live in `supabase/migrations/` and are deployed automatically on push to `develop` via `.github/workflows/staging.yaml`. To run them against a Supabase project locally:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

After any schema change, regenerate the auto types:

```bash
pnpm generate-types   # writes src/core/types/common/database.interface.ts
```

Don't edit `database.interface.ts` by hand; it's overwritten on every regen.

---

## 4. Running locally

### Dev server

```bash
pnpm start:dev
```

Boots the server on `PORT` (default `8000`) with `nodemon` watching `src/`. Logs go to stdout via Winston.

Health check: `curl http://localhost:8000/api/v1/health` → `{"message":"Api up","version":"1.0"}`.
Swagger: open `http://localhost:8000/api/v1/api-docs` in a browser.

### Tests

Tests run on **compiled JS in `build/`**, not source. The pre-commit hook builds + tests automatically. To run manually:

```bash
# Full pipeline
pnpm build
npx jest --no-coverage --runInBand --config ./jest.config.cjs

# Or just one path
npx jest --testPathPattern="createGig" --config ./jest.config.cjs
```

If you've never built and want a one-shot:

```bash
pnpm build && npx jest --no-coverage --runInBand --config ./jest.config.cjs
```

### Smoke tests (curl harness)

`scripts/smoke-tests.sh` exercises every endpoint we've shipped. Bootstrap test users first, then run:

```bash
# 1. Compile + seed two QA users (writes /tmp/gigify-test-creds.env)
pnpm build
node -r module-alias/register -r dotenv/config build/scripts/test-bootstrap.js

# 2. Run the suite
bash scripts/smoke-tests.sh
```

The harness needs the dev server running. It uses the env file produced by step 1.

### Lint / format

```bash
pnpm prettier:check     # CI-style format check
pnpm prettier:fix       # rewrite formatting in place
pnpm lint:check         # eslint
pnpm lint:fix           # eslint --fix
pnpm lint-prettier:fix  # both
```

---

## 5. Code style & conventions

### TypeScript

- `strict: true`, `noImplicitAny: true`. Don't use `any`. Use `unknown` and narrow, or `as never` only for test-mock injection.
- Service classes accept dependencies via constructor injection. Singletons are exported as `default`.
- Public APIs (router → service → repo) all use `camelCase`. The DB uses `snake_case`. Conversion is done by `BaseRepository.mapToCamelCase` / `mapToSnakeCase`. Override these on a per-repo basis only when a column name doesn't fit the auto-conversion (see `GigRepository` for an example).

### File / directory naming

- Folders: lowercase, no separators (`createGig/`)
- Routers: `{module}.router.ts`
- Schemas: lowercase camelCase exports inside `router/schema/index.ts`
- Services: each in its own folder `services/{action}/index.ts`, with a colocated `index.spec.ts`
- Repositories: `{name}.repository.ts`

### Comments

Default to no comments. Only add one when the **why** is non-obvious: a hidden constraint, a workaround, surprising behaviour, or a domain invariant. Don't paraphrase the code.

```ts
// ❌ Don't
const offset = (page - 1) * pageSize; // calculate offset

// ✅ Only when the why isn't obvious
// equipment_provided is the inverse of the FE's isEquipmentRequired,
// flipped when we renamed the column in 20260508.
const isEquipmentRequired = !row.equipment_provided;
```

### Errors

Always throw a typed error from `@/core`:

```ts
import { BadRequestError, RouteNotFoundError, UnAuthorizedError, ConflictError } from '@/core';

if (!params.id) throw new BadRequestError('Gig ID is required');
if (!gig) throw new RouteNotFoundError('Gig not found');
```

The global error handler maps each to the right HTTP status. Don't `res.status(400).send(...)` from a service.

### Email & SMS failures must be non-blocking

`mailService.send()` and `smsService.send()` calls are wrapped in `try/catch`. A failed comms call should never block the primary operation:

```ts
try {
    await mailService.send(welcomeOnboardingMail({ firstName }));
} catch (error) {
    logger.error('welcome email failed', { userId, error });
}
```

### Cross-module communication uses the event bus

Don't import a service from another module. Use `dispatch`:

```ts
import { dispatch } from '@/app';
const [user] = await dispatch('user:get-by-id', { id });
```

Add new event types to `src/app/app-events/event.types.ts` and register listeners in `events.register.ts`.

---

## 6. How to contribute (workflow)

1. **Create a branch off `develop`.** All PRs target `develop`, never `main`.
   ```
   feat/<scope>-<short-description>
   fix/<scope>-<short-description>
   chore/<scope>-<short-description>
   docs/<scope>-<short-description>
   ```
   Examples: `feat/employer-gigs-endpoint`, `fix/talent-search-by-name`, `chore/upload-handler`.

2. **Write the change.** Follow the recipes below for the relevant kind of work.

3. **Run the full pipeline locally before pushing.** The pre-commit hook does this for you:
   - `pnpm prettier:check && pnpm lint:check`
   - `npx tsc --noEmit --skipLibCheck`
   - `pnpm build`
   - `npx jest --no-coverage --runInBand --config ./jest.config.cjs`

4. **Commit messages follow Conventional Commits.** Type prefixes: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Optional scope in parens. The body should explain *why*; the diff already shows what.

   ```
   feat(employers): add GET /employer/:id/gigs endpoint

   Replaces the FE's client-side filter in EmployerGigs.tsx. Reuses
   GigRepository.getAllGigs with employerId pinned from the path,
   validates employer existence via user:get-by-id event.
   ```

5. **Open a PR against `develop`.** Use the PR description to call out:
   - The user-visible change (one sentence)
   - Frontend integration notes if any (which file/line the FE will need to update)
   - Test plan (commands you ran)
   - Migration notes if you touched `supabase/migrations/`

6. **Don't skip the pre-commit hook with `--no-verify`.** If a hook fails, fix the underlying issue.

---

## 7. Contribution recipes

Each recipe lists: **where**, **files**, **conventions**, **how to test**, **naming rules**.

### 7.1 Adding a new route / endpoint

**Where:** the module that owns the resource, e.g. `src/api/v1/gigs/` for a new gig-related endpoint.

**Files you'll typically touch:**

```
src/api/v1/{module}/services/{actionName}/index.ts        # new service class
src/api/v1/{module}/services/{actionName}/index.spec.ts   # new Jest test
src/api/v1/{module}/services/index.ts                     # add export
src/api/v1/{module}/router/schema/index.ts                # add Joi schema
src/api/v1/{module}/router/{module}.router.ts             # mount route + Swagger
src/api/v1/{module}/interfaces/controller.payload.ts      # add DTO if the route takes input/params
```

**Conventions:**

- Wire the route through `ControlBuilder`. Use `.isPrivate()` + `.only(...)` / `.checkResourceOwnership(...)` instead of inline auth checks.
- The service class has a single `handle = async (...)` arrow method. Inject deps via constructor. Export a singleton.
- Validation goes in the Joi schema, not inside the service. The schema lives in `router/schema/index.ts`.
- Add a Swagger JSDoc block immediately above the route, covering request body, params, and a response example. A frontend engineer reading `/api/v1/api-docs` is your audience.

**Skeleton (service):**

```ts
// src/api/v1/gigs/services/getGigSummary/index.ts
import { ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { GetGigSummaryDto } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

export class GetGigSummary {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params }: ControllerArgs<GetGigSummaryDto>) => {
        const gig = await this.gigRepository.getGigById(params.id);
        if (!gig) throw new RouteNotFoundError('Gig not found');

        return {
            code: HttpStatus.OK,
            message: 'Gig Summary Retrieved Successfully',
            data: { id: gig.id, title: gig.title, status: gig.status },
        };
    };
}

const getGigSummary = new GetGigSummary(new GigRepository());
export default getGigSummary;
```

**Skeleton (Joi schema):**

```ts
// src/api/v1/gigs/router/schema/index.ts (add to existing file)
export const getGigSummarySchema = {
    paramsSchema: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};
```

**Skeleton (route + Swagger):**

```ts
// src/api/v1/gigs/router/gig.router.ts (add to existing file)
/**
 * @swagger
 * /gig/{id}/summary:
 *   get:
 *     tags: [Gigs]
 *     summary: Lightweight gig summary
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Gig summary
 */
gigRouter.get(
    '/:id/summary',
    ControlBuilder.builder()
        .setValidator(getGigSummarySchema)
        .setHandler(getGigSummary.handle)
        .handle(),
);
```

**How to test:**

1. Add a Jest spec next to the service (see [7.6](#76-writing-tests)).
2. Add a curl invocation to `scripts/smoke-tests.sh` if the endpoint is user-visible.
3. Run `pnpm build && npx jest --testPathPattern="getGigSummary"`.
4. With the dev server running, smoke-test it manually:
   ```bash
   source /tmp/gigify-test-creds.env
   curl -s "$BASE/gig/<some-uuid>/summary" -H "Authorization: Bearer $TAL_TOKEN"
   ```

### 7.2 Updating an existing service

**Where:** `src/api/v1/{module}/services/{action}/index.ts`.

**Conventions:**

- If you're adding a new field to a request body, **also update the Joi schema** in `router/schema/index.ts`. Missing schema → 422 "X is not allowed".
- If you're adding a new field to a response, also update:
  - The Swagger example in the router file
  - The corresponding type in `interfaces/module.types.ts` if it's a domain field
  - The Jest spec to assert the new field
- If you change a field name, audit the FE. The canonical FE type is `frontend/server/apiTypes/{module}.type.ts`.

**How to test:**

```bash
pnpm build && npx jest --testPathPattern="{action}"
```

### 7.3 Creating a new repository

**Where:** `src/api/v1/{module}/repository/{name}.repository.ts`.

**Conventions:**

- Extend `BaseRepository<TDBRow, TRow>`:
  ```ts
  export class GigOfferRepository extends BaseRepository<DatabaseGigOffer, GigOffer> {
      protected readonly table = 'gig_offers';
      // ... custom methods
  }
  ```
- The two type params are: the auto-generated DB row type (from `database.interface.ts`) and your domain type (defined in `interfaces/module.types.ts`).
- Inherited methods give you `findById`, `findMany({ pagination, filters, orderBy })`, `updateById`, `mapToCamelCase`, `mapToSnakeCase`. Use them; only write raw `supabaseAdmin.from(...)` queries when you need a join, an aggregate, or something the base class doesn't cover.
- If a column doesn't follow the standard snake_case → camelCase rule (e.g. `location_name` → `venueName`), override `mapToCamelCase` and `mapToSnakeCase`. See `GigRepository` for the pattern.
- Export a singleton from the bottom of the file:
  ```ts
  const gigOfferRepository = new GigOfferRepository();
  export default gigOfferRepository;
  ```

**How to test:**

Repository methods are usually tested via the service that calls them. Mock the repository in the service spec rather than testing repository code directly. If you do need a repository-level test, hit a Supabase test project, not the live DB.

### 7.4 Adding a new feature module

**Where:** `src/api/v1/{module}/`.

**Files to create:**

```
{module}/
├── index.ts
├── interfaces/
│   ├── controller.payload.ts
│   ├── module.types.ts
│   └── index.ts
├── repository/
│   ├── {name}.repository.ts
│   └── index.ts
├── router/
│   ├── {name}.router.ts
│   └── schema/
│       └── index.ts
├── services/
│   └── index.ts
└── listeners.ts (optional, only if the module subscribes to bus events)
```

**Wire it up:**

- Mount the router in `src/app/app.router.ts`:
  ```ts
  import { promosRouter } from '@/api/v1/promos';
  appRouter.use('/promos', promosRouter);
  ```
- If the module emits or listens to events, register listeners in `src/app/app-events/events.register.ts` and add types to `event.types.ts`.

**How to test:**

- Each service should have an `index.spec.ts`.
- After wiring, smoke-test with curl on the dev server.

### 7.5 Fixing a bug

1. **Reproduce first.** Add a failing Jest test that captures the bug, or write a curl invocation that demonstrates the wrong behaviour. Don't touch implementation until the failing case is reliable.
2. **Fix the smallest surface area.** Don't refactor unrelated code in a bug-fix PR.
3. **Lock the fix in with a regression test.** The test you wrote in step 1 should now pass; commit it alongside the fix so the bug can't quietly come back.
4. **PR title:** `fix(<scope>): <what was broken>`. Body explains the root cause, not the symptom.

### 7.6 Writing tests

Tests are **colocated** with the service they test: `src/api/v1/{module}/services/{action}/index.spec.ts`. They run on the compiled JS in `build/`, so always `pnpm build` before running.

**Pattern: mock everything the service imports, then test the class directly.**

```ts
// src/api/v1/gigs/services/getGigSummary/index.spec.ts
jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
    RouteNotFoundError: class extends Error {},
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
}));

import { GetGigSummary } from './index';

describe('GetGigSummary', () => {
    it('returns the gig summary', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({ id: 'gig-1', title: 'DJ Set', status: 'open' }),
        };
        const service = new GetGigSummary(gigRepository as never);

        const response = await service.handle({ params: { id: 'gig-1' } } as never);

        expect(response.code).toBe(200);
        expect(response.data.title).toBe('DJ Set');
    });

    it('throws RouteNotFoundError when the gig does not exist', async () => {
        const gigRepository = { getGigById: jest.fn().mockResolvedValue(null) };
        const service = new GetGigSummary(gigRepository as never);

        await expect(service.handle({ params: { id: 'missing' } } as never)).rejects.toThrow('Gig not found');
    });
});
```

**Conventions:**

- Mock everything the service imports: `@/core`, `@/app`, and other modules' repositories.
- Use `as never` for mock injection to bypass strict types in test fixtures.
- Test the happy path, error cases, and one or two edge cases. Don't aim for 100% line coverage; aim for behavioural coverage.
- Don't import the real Supabase client. Tests must not hit the network.

### 7.7 Updating documentation

- **Swagger** lives in JSDoc comments above each route in `router/{name}.router.ts`. Keep examples in sync with the actual response shape.
- **README.md** is the deep architecture guide. Update it for big structural changes.
- **CONTRIBUTING.md** (this file) is for workflow. Update it when you change the contribution process, branch conventions, or test commands.
- **CLAUDE.md** in `.claude/` is for AI assistants. Don't put human-facing docs there.

---

## 8. Useful commands

```bash
# Dev
pnpm start:dev                                              # nodemon + dotenv
npx tsc --noEmit --skipLibCheck                             # type check, no emit
pnpm build                                                  # full TS compile to build/

# Tests
pnpm build && npx jest --no-coverage --runInBand --config ./jest.config.cjs
npx jest --testPathPattern="<name>" --config ./jest.config.cjs

# Lint / format
pnpm prettier:check
pnpm prettier:fix
pnpm lint:check
pnpm lint:fix
pnpm lint-prettier:fix

# Database
pnpm generate-types                                         # refresh src/core/types/common/database.interface.ts
supabase db push                                            # apply pending migrations to the linked project

# Seed
pnpm seed                                                   # build + run src/scripts/seed/index.ts

# Smoke tests
node -r module-alias/register -r dotenv/config build/scripts/test-bootstrap.js
bash scripts/smoke-tests.sh

# Deploy (Fly.io; usually CI runs this on merge to develop)
fly deploy
fly secrets set KEY=VALUE
fly logs
```

---

## Need help?

- **Architecture deep-dive**: read [README.md](./README.md) section 5 ("Internal Architecture")
- **A working example of the patterns**: `src/api/v1/employers/services/getEmployerGigs/` is a small, recent end-to-end module touch (route + service + Joi schema + spec)
- **Why does X behave the way it does?** `git log` and the PR descriptions are the best context source. Most non-obvious decisions are explained in the commit body.
- **Stuck?** Ask in the team channel. The codebase isn't perfect; questions improve it.
