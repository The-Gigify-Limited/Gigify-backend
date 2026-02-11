# Security Audit & RBAC Improvement Plan

## 1. Executive Summary

This document outlines critical security gaps in the current Access Control implementation and proposes a robust **Permission-Based (PBAC)** and **Attribute-Based (ABAC)** access control flow. The current implementation relies on static Role-Based checks which are insufficient for preventing Insecure Direct Object References (IDOR) and lack flexibility.

## 2. Critical Vulnerabilities Identified

### 2.1. Incorrect Role Source of Truth (Critical)

**Severity**: High
**Location**: `core/handlers/controlBuilder/index.utils.ts` -> `handlePrivateRequest`
**Issue**: The current code fetches the user role from Supabase Auth metadata (`user.role`).

```typescript
const { data: { user } } = await supabaseAdmin.auth.getUser(token);
// ...
const isRequestAuthorized = options.allowedRoles?.includes(user?.role...);
```

**Implication**: Supabase Auth usually returns `authenticated` as the role for logged-in users. It **does not** return your application roles (`TALENT`, `EMPLOYER`) unless custom claims are set up. This will likely cause all authorization checks to fail (Denial of Service) or, worse, pass incorrectly if logic is flawed.

### 2.2. Missing Ownership Checks (IDOR Risk)

**Severity**: Critical
**Location**: `api/v1/user/router/user.router.ts`
**Issue**: Routes like `PATCH /user/:id` checks if the user has a role, but **does not check if the user owns the resource**.

```typescript
// Current Flow
.patch('/:id', ControlBuilder.builder().isPrivate().handle())
```

**Implication**: Any authenticated user (e.g., a malicious Talent) can update the profile of _any other_ user by simply changing the `:id` parameter. This is a classic **Insecure Direct Object Reference (IDOR)** vulnerability.

### 2.3. Hardcoded Role Logic (Scalability Risk)

**Issue**: `.only(UserRoleEnum.TALENT)` couples code to specific roles.
**Implication**: If you introduce a "MODERATOR" role that also needs access, you must refactor every single route file.

---

## 3. Proposed Solution: Hybrid PBAC + ABAC Flow

We propose moving from a simple "Role Check" to a "Context-Aware Permission Check".

### 3.1. The New ControlBuilder Interface

**Before (Current):**

```typescript
ControlBuilder.builder()
    .isPrivate()
    .only('TALENT') // Rigid, no ownership check
    .handle();
```

**After (Proposed):**

```typescript
ControlBuilder.builder()
    .isPrivate()
    .can('user:update') // Check Permission, not Role
    .owns('params.id') // Check Ownership (ABAC)
    .handle();
```

---

## 4. Implementation Details (Before vs After)

### 4.1. Fixing the Role Source (`index.utils.ts`)

**Before:**

```typescript
// src/core/handlers/controlBuilder/index.utils.ts

export const handlePrivateRequest = async (req: Request, options: ControllerHandlerOptions) => {
    // ... existing token extraction ...
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    // ❌ DANGER: Checks internal Supabase role ('authenticated'), not App role ('TALENT')
    if (options.allowedRoles && options.allowedRoles.length > 0) {
        const isRequestAuthorized = options.allowedRoles?.includes(user?.role...);
        // ...
    }
};
```

**After:**

```typescript
// src/core/handlers/controlBuilder/index.utils.ts
import userRepository from '~/user/repository';

export const handlePrivateRequest = async (req: Request, options: ControllerHandlerOptions) => {
    // 1. Get Auth User
    const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(token);

    // 2. ✅ FIX: Fetch App Profile to get real Role
    const dbUser = await userRepository.findById(authUser.id);
    if (!dbUser) throw new UnAuthorizedError('Profile not found');

    // 3. Merge contexts
    const fullUser = { ...authUser, ...dbUser }; // role is now 'TALENT'/'EMPLOYER'

    // 4. Check Roles/Permissions
    if (options.allowedRoles) {
         const isRequestAuthorized = options.allowedRoles.includes(fullUser.role);
         if (!isRequestAuthorized) throw new ForbiddenError(...);
    }

    req.user = fullUser;
};
```

### 4.2. Implementing Ownership Checks (`index.builder.ts` & `index.handler.ts`)

You need to add an `.owns()` method to the builder to enforce that `req.user.id` matches the target resource ID.

**Before (index.builder.ts):**
_Does not exist._

**After (index.builder.ts):**

```typescript
export class ControlBuilder {
    // ...
    private options: ControllerHandlerOptions = {
        isPrivate: false,
        checkOwnership: false, // New Option
        ownershipSource: '', // e.g., 'params.id'
    };

    /**
     * Enforces that the current user owns the resource being accessed.
     * @param sourcePath - Path to the ID in request (e.g., 'params.id', 'body.userId')
     */
    owns(sourcePath: string = 'params.id') {
        this.options = {
            ...this.options,
            isPrivate: true, // Ownership implies privacy
            checkOwnership: true,
            ownershipSource: sourcePath,
        };
        return this;
    }
}
```

**After (index.utils.ts - logic):**

```typescript
// Inside handlePrivateRequest or a new handleAuthorization function
if (options.checkOwnership) {
    // Extract ID from request based on sourcePath (e.g., req.params.id)
    const resourceId = get(req, options.ownershipSource);

    // Compare with User ID
    if (req.user.id !== resourceId) {
        // Optional: Allow Admin override
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenError('You are not allowed to access this resource');
        }
    }
}
```

### 4.3. Secure Router Usage (`user.router.ts`)

**Before:**

```typescript
// src/api/v1/user/router/user.router.ts
.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        // ❌ Missing: Anyone can edit anyone if they guess the ID
        .setHandler(updateUserById.handle)
        .handle(),
)
```

**After:**

```typescript
// src/api/v1/user/router/user.router.ts
.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .owns('params.id') // ✅ FIX: Enforce ownership
        .setHandler(updateUserById.handle)
        .handle(),
)
```

## 5. Deep Dive: Handling Complex Ownership (Gigs, Orders, Modules)

The basic `owns('params.id')` check assumes the ID in the URL is the **User's ID** (e.g., editing your own profile).
However, for resources like **Gigs**, **Orders**, or **Invoices**, the ID in the URL is the _Resource ID_ (e.g., `/gigs/:gigId`), not the User ID.

To handle this, you need a mechanism to **fetch the resource** and check its `owner_id` or `creator_id` field.

### 5.1. The "Resource Resolver" Pattern

We can extend `owns()` to accept a **Service** or **Resolver** configuration.

**Proposed Interface:**

```typescript
type OwnershipConfig = {
    sourcePath: string; // Where is the ID? (e.g., 'params.id')
    service?: {
        repository: any; // The Repository to find the item
        ownerField: string; // The field on the item that holds the Owner ID (e.g., 'employer_id')
    };
};
```

**Updated Builder Method:**

```typescript
ownsResource(config: OwnershipConfig) {
    this.options = {
        ...this.options,
        isPrivate: true,
        checkOwnership: true,
        ownershipConfig: config
    };
    return this;
}
```

**Updated Logic (index.utils.ts):**

```typescript
// Inside handlePrivateRequest
if (options.checkOwnership) {
    const resourceId = get(req, options.ownershipConfig.sourcePath);

    // Case 1: Direct Ownership (URL ID == User ID)
    if (!options.ownershipConfig.service) {
        if (req.user.id !== resourceId) throw new ForbiddenError();
        return;
    }

    // Case 2: Indirect Ownership (Resource Lookup)
    // 1. Fetch the resource using the provided Repository/Service
    const resource = await options.ownershipConfig.service.repository.findById(resourceId);

    if (!resource) throw new NotFoundError('Resource not found');

    // 2. Check if the resource's owner field matches the current user
    const ownerId = resource[options.ownershipConfig.service.ownerField]; // e.g., resource.employer_id

    if (ownerId !== req.user.id) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenError('You do not own this resource');
    }
}
```

### 5.2. Example: Protecting a Gig Route

Imagine a route `PATCH /gigs/:gigId`. Only the Employer who created the gig should edit it.

**The Repository:**
Assume `GigRepository` has a `findById(id)` method and returns `{ id: '...', employer_id: '...' }`.

**The Router Usage:**

```typescript
// src/api/v1/gigs/router/gig.router.ts
import { GigRepository } from '@gigs/repository';

.patch(
    '/:gigId',
    ControlBuilder.builder()
        .isPrivate()
        // Check if Gig.employer_id === req.user.id
        .ownsResource({
            sourcePath: 'params.gigId',
            service: {
                repository: new GigRepository(),
                ownerField: 'employerId' // Matches the field in your DB/Model
            }
        })
        .setHandler(updateGig.handle)
        .handle()
)
```

### 5.3. Summary of Ownership Modes

| Mode                   | Use Case                                      | Code Example                                                    | Logic                            |
| :--------------------- | :-------------------------------------------- | :-------------------------------------------------------------- | :------------------------------- |
| **Self-Ownership**     | User editing their own profile (`/users/:id`) | `.owns('params.id')`                                            | `req.user.id === req.params.id`  |
| **Resource-Ownership** | Employer editing their Gig (`/gigs/:id`)      | `.ownsResource({ service: gigRepo, ownerField: 'employerId' })` | `Gig.employerId === req.user.id` |
| **Context-Ownership**  | Complex logic (e.g., Group Admin)             | _Use a custom middleware or callback_                           | _Custom Logic_                   |

## 6. Other Observations (Housekeeping)

In `src/api/v1/user/router/user.router.ts`, there are potential copy-paste errors where `deleteUserById.handle` is used for unrelated routes:

-   `POST /reviews` -> uses `deleteUserById` (?)
-   `GET /me/timeline` -> uses `deleteUserById` (?)
-   `GET /:id/reviews` -> uses `deleteUserById` (?)

**Recommendation**: Audit all routes to ensure the handler matches the intent. Using a delete handler for a GET request is a severe functional bug.
