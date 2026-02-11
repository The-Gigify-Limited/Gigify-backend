# RBAC & Security Implementation Analysis

## Quick Navigation to Implementation Guides

- **[#1 Granular Permission System](#-implementation-guide-granular-permission-system)** - Role-based access with fine-grained permissions
- **[#2 Resource-Level Authorization](#-implementation-guide-resource-level-authorization)** - Ownership checks to prevent cross-user access
- **[#4 Audit Logging (Optional)](#-implementation-guide-audit-logging-optional-middleware)** - Event tracking with easy enable/disable

---

## All Files That Need Changes (Complete Summary)

### Core Framework Files (Affect all features)
| File | Purpose |
|------|---------|
| `src/core/handlers/controlBuilder/index.interface.ts` | Options interface |
| `src/core/handlers/controlBuilder/index.builder.ts` | Builder methods |
| `src/core/handlers/controlBuilder/index.utils.ts` | Auth/permission checking |
| `src/core/handlers/controlBuilder/index.handler.ts` | Middleware execution |

### Feature-Specific New Files
| Feature | Files to Create |
|---------|-----------------|
| **#1: Permissions** | `src/core/authorization/permissions.ts`, `permission.repository.ts`, `index.ts` |
| **#2: Ownership** | `src/core/authorization/resource.repository.ts` (updated index.ts) |
| **#4: Audit** | `src/core/logging/audit-log.types.ts`, `audit-log.repository.ts`, `audit.service.ts` |

### Database Migrations (Sequelize)
```
src/core/database/migrations/
├── [ts]-create-role-permissions-table.js        (#1)
├── [ts]-create-audit-logs-table.js              (#4)
```

### Router Files (Need updates for each endpoint)
```
src/api/v1/*/router/*router.ts

Add .requirePermissions() to each endpoint
Add .checkResourceOwnership() to state-changing endpoints  
Add .enableAuditLogging() to critical operations
```

### Configuration Files
```
.env                              Add ENABLE_AUDIT_LOGGING=true
src/core/index.ts                Add exports for new modules
```

---

## Current State ✅

Your current implementation has:

-   **Authentication**: Supabase token validation via Bearer tokens
-   **Authorization**: Role-based checks using `.only(...roles)` in ControlBuilder
-   **Two Roles**: `talent` and `employer`
-   **User Status Tracking**: `active` | `suspended`
-   **Request Validation**: Joi schema validation for input

---

## Critical Missing Components 🔴

### 1. **Granular Permission System (No Fine-Grained Access Control)**

**Current**:

```typescript
// Only checking if user has a role
ControlBuilder.builder().only(UserRoleEnum.TALENT).setHandler(getSomeHandler).handle();
```

**Problem**:

-   You check only "is user a talent?", not "can this talent edit THIS gig?" or "can talent view earnings?"
-   All talents have identical access to all endpoints
-   No way to grant admin capabilities within a role

**What You're Missing**:

```typescript
// RBAC v2: Roles with Permissions
export enum Permission {
    // User Management
    USER_CREATE = 'user:create',
    USER_READ = 'user:read',
    USER_UPDATE = 'user:update',
    USER_DELETE = 'user:delete',

    // Gig Management
    GIG_CREATE = 'gig:create',
    GIG_UPDATE = 'gig:update',
    GIG_DELETE = 'gig:delete',
    GIG_VIEW_ALL = 'gig:view:all', // Admins only

    // Payment/Finance
    PAYOUT_REQUEST = 'payout:request',
    PAYMENT_PROCESS = 'payment:process', // Admin

    // Reviews
    REVIEW_CREATE = 'review:create',
    REVIEW_DELETE = 'review:delete',
    REVIEW_MODERATE = 'review:moderate', // Admin
}

export enum Role {
    TALENT = 'talent',
    EMPLOYER = 'employer',
    ADMIN = 'admin',
    SUPPORT = 'support',
}

// Role-to-Permission Mapping
const rolePermissions: Record<Role, Permission[]> = {
    [Role.TALENT]: [
        Permission.USER_READ,
        Permission.USER_UPDATE, // Only own profile
        Permission.GIG_CREATE,
        Permission.GIG_UPDATE, // Only own gigs
        Permission.PAYOUT_REQUEST,
        Permission.REVIEW_CREATE,
    ],
    [Role.EMPLOYER]: [
        Permission.USER_READ,
        Permission.USER_UPDATE, // Only own profile
        Permission.GIG_CREATE,
        Permission.GIG_UPDATE, // Only own gigs
        Permission.PAYMENT_PROCESS,
        Permission.REVIEW_CREATE,
    ],
    [Role.ADMIN]: [
        // All permissions
        ...Object.values(Permission),
    ],
    [Role.SUPPORT]: [Permission.USER_READ, Permission.USER_UPDATE, Permission.REVIEW_MODERATE, Permission.GIG_VIEW_ALL],
};
```

**Implementation**:

```typescript
// Updated ControlBuilder
.only(UserRoleEnum.TALENT)
.requirePermissions(Permission.GIG_CREATE, Permission.PAYOUT_REQUEST)
.handle()

// OR resource-level authorization
.requireResourceOwnership('gig') // User can only modify their own gigs
.handle()
```

---

## ✅ IMPLEMENTATION GUIDE: Granular Permission System

### Files to Create

#### 1. `src/core/authorization/permissions.ts` (NEW)
```typescript
export enum Permission {
    // User Management
    USER_CREATE = 'user:create',
    USER_READ = 'user:read',
    USER_UPDATE = 'user:update',
    USER_DELETE = 'user:delete',

    // Gig Management
    GIG_CREATE = 'gig:create',
    GIG_READ = 'gig:read',
    GIG_UPDATE = 'gig:update',
    GIG_DELETE = 'gig:delete',
    GIG_VIEW_ALL = 'gig:view:all',

    // Payment/Finance
    PAYOUT_REQUEST = 'payout:request',
    PAYMENT_PROCESS = 'payment:process',
    VIEW_EARNINGS = 'view:earnings',

    // Reviews
    REVIEW_CREATE = 'review:create',
    REVIEW_READ = 'review:read',
    REVIEW_DELETE = 'review:delete',
    REVIEW_MODERATE = 'review:moderate',
    
    // Admin
    SUSPEND_USER = 'suspend:user',
    VIEW_AUDIT_LOGS = 'view:audit:logs',
}

export enum Role {
    TALENT = 'talent',
    EMPLOYER = 'employer',
    ADMIN = 'admin',
    SUPPORT = 'support',
}

// Role-to-Permission mapping
export const rolePermissions: Record<Role, Permission[]> = {
    [Role.TALENT]: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.GIG_CREATE,
        Permission.GIG_READ,
        Permission.GIG_UPDATE,
        Permission.PAYOUT_REQUEST,
        Permission.REVIEW_CREATE,
        Permission.REVIEW_READ,
        Permission.VIEW_EARNINGS,
    ],
    [Role.EMPLOYER]: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.GIG_CREATE,
        Permission.GIG_READ,
        Permission.GIG_UPDATE,
        Permission.PAYMENT_PROCESS,
        Permission.REVIEW_CREATE,
        Permission.REVIEW_READ,
    ],
    [Role.ADMIN]: Object.values(Permission), // All permissions
    [Role.SUPPORT]: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.GIG_READ,
        Permission.REVIEW_READ,
        Permission.REVIEW_MODERATE,
        Permission.GIG_VIEW_ALL,
        Permission.VIEW_AUDIT_LOGS,
    ],
};
```

#### 2. `src/core/authorization/permission.repository.ts` (NEW)
```typescript
import { BaseRepository } from '@/core/repository';
import { supabaseAdmin } from '@/core/config/database';
import { Permission, Role, rolePermissions } from './permissions';

export class PermissionRepository extends BaseRepository<any, any> {
    protected readonly table = 'role_permissions';

    async getRolePermissions(role: Role): Promise<Permission[]> {
        // First check database for role-specific overrides
        const { data } = await supabaseAdmin
            .from(this.table)
            .select('permission')
            .eq('role', role);

        if (data && data.length > 0) {
            return data.map(r => r.permission as Permission);
        }

        // Fall back to hardcoded role permissions
        return rolePermissions[role] || [];
    }

    async hasPermission(userId: string, permission: Permission): Promise<boolean> {
        const user = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (!user.data) return false;

        const userPermissions = await this.getRolePermissions(user.data.role as Role);
        return userPermissions.includes(permission);
    }

    async checkPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
        const user = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (!user.data) return false;

        const userPermissions = await this.getRolePermissions(user.data.role as Role);
        return permissions.every(perm => userPermissions.includes(perm));
    }
}
```

#### 3. `src/core/authorization/index.ts` (NEW)
```typescript
export * from './permissions';
export * from './permission.repository';
```

### Files to Modify

#### 4. `src/core/handlers/controlBuilder/index.interface.ts`
**ADD import at top:**
```typescript
import { Permission } from '@/core/authorization';
```

**BEFORE (ControllerHandlerOptions):**
```typescript
export type ControllerHandlerOptions = {
    isPrivate: boolean;
    allowedRoles?: UserRoleEnum[];
};
```

**AFTER:**
```typescript
export type ControllerHandlerOptions = {
    isPrivate: boolean;
    allowedRoles?: UserRoleEnum[];
    requiredPermissions?: Permission[];
};
```

#### 5. `src/core/handlers/controlBuilder/index.builder.ts`
**ADD import at top:**
```typescript
import { Permission } from '@/core/authorization';
```

**ADD property to ControlBuilder class:**
```typescript
private requiredPermissions: Permission[] = [];
```

**ADD method to ControlBuilder class:**
```typescript
/**
 * Requires specific permissions to access the route.
 * @param {...Permission[]} permissions - The permissions required.
 * @returns {ControlBuilder} The instance of this builder for chaining.
 */
requirePermissions(...permissions: Permission[]) {
    this.requiredPermissions = permissions;
    return this;
}
```

**MODIFY handle() method to include requiredPermissions:**
```typescript
handle() {
    return new ControllerHandler().handle(
        this.handler,
        this.schema,
        {
            ...this.options,
            requiredPermissions: this.requiredPermissions,
        }
    );
}
```

#### 6. `src/core/handlers/controlBuilder/index.utils.ts`
**ADD imports at top:**
```typescript
import { PermissionRepository, Permission } from '@/core/authorization';

const permissionRepository = new PermissionRepository();
```

**ADD new function before handlePrivateRequest:**
```typescript
export const checkPermissions = async (
    userId: string,
    requiredPermissions?: Permission[]
): Promise<void> => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return;
    }

    const hasAllPermissions = await permissionRepository.checkPermissions(
        userId,
        requiredPermissions
    );

    if (!hasAllPermissions) {
        throw new ForbiddenError(
            'You do not have the required permissions to perform this action'
        );
    }
};
```

**MODIFY handlePrivateRequest to add permission check after role check:**
```typescript
// After the existing allowedRoles check, ADD:
if (options.requiredPermissions && options.requiredPermissions.length > 0) {
    await checkPermissions(user.id, options.requiredPermissions);
}
```

### Migration SQL

#### 7. Create migration: `src/core/database/migrations/[timestamp]-create-role-permissions-table.js`
```javascript
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('role_permissions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            role: {
                type: Sequelize.ENUM('talent', 'employer', 'admin', 'support'),
                allowNull: false,
            },
            permission: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
        });

        await queryInterface.addConstraint('role_permissions', {
            fields: ['role', 'permission'],
            type: 'unique',
            name: 'unique_role_permission',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('role_permissions');
    },
};
```

### Usage Examples

#### In `src/api/v1/gig/router/gig.router.ts` (Example):
```typescript
import { Permission } from '@/core/authorization';

.post('/',
    ControlBuilder.builder()
        .isPrivate()
        .requirePermissions(Permission.GIG_CREATE)
        .setValidator(createGigSchema)
        .setHandler(createGig.handle)
        .handle()
)
```

#### In `src/api/v1/user/router/user.router.ts` (Example):
```typescript
import { Permission } from '@/core/authorization';

.get('/:id',
    ControlBuilder.builder()
        .isPrivate()
        .requirePermissions(Permission.USER_READ)
        .setValidator(getUserParamsSchema)
        .setHandler(getUserById.handle)
        .handle()
)
```

### Summary: Files Changed for #1

| File | Action |
|------|--------|
| `src/core/authorization/permissions.ts` | Create - Permission & Role enums |
| `src/core/authorization/permission.repository.ts` | Create - Permission checking logic |
| `src/core/authorization/index.ts` | Create - Exports |
| `src/core/handlers/controlBuilder/index.interface.ts` | Modify - Add `requiredPermissions` |
| `src/core/handlers/controlBuilder/index.builder.ts` | Modify - Add `requirePermissions()` method |
| `src/core/handlers/controlBuilder/index.utils.ts` | Modify - Add `checkPermissions()` & update `handlePrivateRequest()` |
| `src/core/database/migrations/[ts]-create-role-permissions.js` | Create - Database table |
| All router files | Modify - Add `.requirePermissions()` to endpoints |
| `src/core/index.ts` | Modify - Export authorization module |

---

### 2. **No Resource-Level Authorization (`RBAC` → `ABAC` missing)**

**Current Issue in user.router.ts**:

```typescript
.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(updateUserSchema)
        .setHandler(updateUserById.handle)  // ❌ No ownership check
        .handle(),
)
. delete(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(getUserParamsSchema)
        .setHandler(deleteUserById.handle)  // ❌ Any authenticated user can delete any user
        .handle(),
)
```

**Problem**: User A can modify/delete User B's profile if they're authenticated.

**What You Need**:

```typescript
// BEFORE: In handler (index.utils.ts)
export const handlePrivateRequest = async (req: Request, options: ControllerHandlerOptions) => {
    // Current: Only validates user exists and has role
    if (options.allowedRoles && options.allowedRoles.length > 0) {
        const isRequestAuthorized = options.allowedRoles?.includes(user?.role);
        if (!isRequestAuthorized) throw new ForbiddenError('...');
    }
    req.user = user;
};

// AFTER: Add resource authorization layer
interface ResourceAuthorizationOptions {
    resourceType: 'user' | 'gig' | 'review' | 'payment';
    checkOwnership?: boolean;        // Only resource owner can access
    adminCanBypass?: boolean;       // Admins can access any resource
    permissionsRequired?: Permission[];
}

export const checkResourceAuthorization = async (
    req: Request,
    resourceId: string,
    options: ResourceAuthorizationOptions
): Promise<boolean> => {
    const user = req.user!;

    // Admin bypass
    if (options.adminCanBypass && user.role === Role.ADMIN) {
        return true;
    }

    // Check permissions
    if (options.permissionsRequired) {
        const userPermissions = await getUserPermissions(user.id);
        const hasAll = options.permissionsRequired.every(
            perm => userPermissions.includes(perm)
        );
        if (!hasAll) return false;
    }

    // Check ownership
    if (options.checkOwnership) {
        const resource = await getResource(options.resourceType, resourceId);
        if (resource.user_id !== user.id) return false;
    }

    return true;
};

// In handler:
.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(updateUserSchema)
        .setResourceOwner('user', true)  // Only own profile
        .setHandler(updateUserById.handle)
        .handle(),
)
```

---

## ✅ IMPLEMENTATION GUIDE: Resource-Level Authorization

### Files to Create

#### 1. `src/core/authorization/resource.repository.ts` (NEW)
```typescript
import { supabaseAdmin } from '@/core/config/database';
import { BaseRepository } from '@/core/repository';

export type ResourceType = 'user' | 'gig' | 'review' | 'payment';

export class ResourceRepository extends BaseRepository<any, any> {
    /**
     * Check if user owns a specific resource
     */
    async isResourceOwner(
        userId: string,
        resourceType: ResourceType,
        resourceId: string
    ): Promise<boolean> {
        const { data } = await supabaseAdmin
            .from(this.getTableName(resourceType))
            .select('user_id')
            .eq('id', resourceId)
            .single();

        if (!data) return false;
        return data.user_id === userId;
    }

    /**
     * Get the user ID of resource owner
     */
    async getResourceOwner(
        resourceType: ResourceType,
        resourceId: string
    ): Promise<string | null> {
        const { data } = await supabaseAdmin
            .from(this.getTableName(resourceType))
            .select('user_id')
            .eq('id', resourceId)
            .single();

        return data?.user_id || null;
    }

    /**
     * Map resource type to table name
     */
    private getTableName(resourceType: ResourceType): string {
        const tableMap: Record<ResourceType, string> = {
            user: 'users',
            gig: 'gigs',
            review: 'reviews',
            payment: 'payments',
        };
        return tableMap[resourceType];
    }
}
```

#### 2. Update `src/core/authorization/index.ts`
**ADD:**
```typescript
export * from './resource.repository';
```

### Files to Modify

#### 3. `src/core/handlers/controlBuilder/index.interface.ts`
**MODIFY ControllerHandlerOptions to add:**
```typescript
export type ControllerHandlerOptions = {
    isPrivate: boolean;
    allowedRoles?: UserRoleEnum[];
    requiredPermissions?: Permission[];
    checkResourceOwnership?: {
        resourceType: 'user' | 'gig' | 'review' | 'payment';
        paramName?: string; // Default: 'id'
        adminCanBypass?: boolean;
    };
};
```

#### 4. `src/core/handlers/controlBuilder/index.builder.ts`
**ADD property:**
```typescript
private resourceOwnershipCheck?: {
    resourceType: 'user' | 'gig' | 'review' | 'payment';
    paramName?: string;
    adminCanBypass?: boolean;
};
```

**ADD method:**
```typescript
/**
 * Checks if user owns the resource before allowing access
 * @param resourceType - Type of resource (user, gig, review, payment)
 * @param paramName - The param name containing resource ID (default: 'id')
 * @param adminCanBypass - Allow admins to bypass ownership check (default: true)
 * @returns {ControlBuilder} The instance of this builder for chaining
 */
checkResourceOwnership(
    resourceType: 'user' | 'gig' | 'review' | 'payment',
    paramName: string = 'id',
    adminCanBypass: boolean = true
) {
    this.resourceOwnershipCheck = {
        resourceType,
        paramName,
        adminCanBypass,
    };
    return this;
}
```

**UPDATE handle() method:**
```typescript
handle() {
    return new ControllerHandler().handle(
        this.handler,
        this.schema,
        {
            ...this.options,
            requiredPermissions: this.requiredPermissions,
            checkResourceOwnership: this.resourceOwnershipCheck,
        }
    );
}
```

#### 5. `src/core/handlers/controlBuilder/index.utils.ts`
**ADD imports:**
```typescript
import { ResourceRepository, ResourceType } from '@/core/authorization';

const resourceRepository = new ResourceRepository();
```

**ADD new function:**
```typescript
export const verifyResourceOwnership = async (
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    options?: { adminCanBypass?: boolean; userRole?: string }
): Promise<void> => {
    // Allow admins to bypass ownership check
    if (options?.adminCanBypass && options?.userRole === 'admin') {
        return;
    }

    const isOwner = await resourceRepository.isResourceOwner(
        userId,
        resourceType,
        resourceId
    );

    if (!isOwner) {
        throw new ForbiddenError(
            'You can only access your own resources'
        );
    }
};
```

**MODIFY handlePrivateRequest to add ownership check - ADD before `req.user = user;`:**
```typescript
    // ✅ ADD: Check resource ownership if specified
    if (options.checkResourceOwnership) {
        const resourceId = req.params[options.checkResourceOwnership.paramName || 'id'];
        
        if (!resourceId) {
            throw new BadRequestError('Resource ID not found in request parameters');
        }

        await verifyResourceOwnership(
            user.id,
            options.checkResourceOwnership.resourceType,
            resourceId,
            {
                adminCanBypass: options.checkResourceOwnership.adminCanBypass,
                userRole: user.role,
            }
        );
    }
```

### Usage Examples

#### In `src/api/v1/user/router/user.router.ts`:
```typescript
import { Permission } from '@/core/authorization';

// Update own profile
.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .requirePermissions(Permission.USER_UPDATE)
        .checkResourceOwnership('user')  // ✅ Can only update own profile
        .setValidator(updateUserSchema)
        .setHandler(updateUserById.handle)
        .handle(),
)

// Delete own account
.delete(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .requirePermissions(Permission.USER_DELETE)
        .checkResourceOwnership('user', 'id', true)  // Admins can delete any user
        .setValidator(getUserParamsSchema)
        .setHandler(deleteUserById.handle)
        .handle(),
)
```

#### In `src/api/v1/gig/router/gig.router.ts`:
```typescript
import { Permission } from '@/core/authorization';

// Update gig (only owner or admin)
.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .requirePermissions(Permission.GIG_UPDATE)
        .checkResourceOwnership('gig')  // Only gig creator can update
        .setValidator(updateGigSchema)
        .setHandler(updateGig.handle)
        .handle(),
)

// Delete gig
.delete(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .requirePermissions(Permission.GIG_DELETE)
        .checkResourceOwnership('gig')
        .setValidator(getGigParamsSchema)
        .setHandler(deleteGig.handle)
        .handle(),
)
```

### Summary: Files Changed for #2

| File | Action |
|------|--------|
| `src/core/authorization/resource.repository.ts` | Create - Resource ownership checks |
| `src/core/authorization/index.ts` | Modify - Add export |
| `src/core/handlers/controlBuilder/index.interface.ts` | Modify - Add `checkResourceOwnership` option |
| `src/core/handlers/controlBuilder/index.builder.ts` | Modify - Add `checkResourceOwnership()` method |
| `src/core/handlers/controlBuilder/index.utils.ts` | Modify - Add `verifyResourceOwnership()` + update `handlePrivateRequest()` |
| All affected router files | Modify - Add `.checkResourceOwnership()` to state-changing endpoints |

---

### 3. **No Token Refresh/Rotation Strategy**

**Current in auth.router.ts**:

```typescript
// These are COMMENTED OUT!
// forgotPassword,
// refreshToken,          // ❌ Not implemented
// resetPassword,
```

**Problem**:

-   Access tokens never refresh
-   If token is compromised, attacker has unlimited access until expiration
-   No way to revoke tokens on logout
-   No support for sliding window sessions

**What You Need**:

```typescript
// BEFORE: Token-only approach
const authHeader = req.headers.authorization;
const token = authHeader.split(' ')[1];
const { data: { user } } = await supabaseAdmin.auth.getUser(token);

// AFTER: Implement refresh token flow
export interface TokenPair {
    accessToken: string;        // Short-lived (15 mins)
    refreshToken: string;       // Long-lived (7 days) - stored in httpOnly cookie
    expiresAt: number;
}

// On login
.post('/auth/login', (req, res) => {
    const { accessToken, refreshToken } = await login(email, password);

    // Store refresh token in secure httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
        accessToken,
        expiresIn: 15 * 60, // 15 minutes
    });
});

// Token refresh endpoint
.post('/auth/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new UnAuthorizedError('No refresh token');

    const { accessToken, expiresAt } = await refreshAccessToken(refreshToken);
    res.json({ accessToken, expiresIn: 15 * 60 });
});

// Logout - invalidate tokens
.post('/auth/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    await tokenBlacklist.add(refreshToken); // Store in Redis

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
});
```

---

### 4. **No Audit Logging**

**Current State**: Zero tracking of who did what

**What You're Missing**:

```typescript
// Create audit log table (migration)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),              // 'USER_UPDATED', 'GIG_DELETED', 'PAYMENT_PROCESSED'
    resource_type VARCHAR(50),        // 'user', 'gig', 'payment'
    resource_id UUID,
    changes JSONB,                    // What fields changed
    ip_address INET,
    user_agent TEXT,
    result 'success' | 'failure',     // Did the action succeed?
    error_message TEXT,
    created_at TIMESTAMP,
    INDEX (user_id, created_at),
    INDEX (resource_type, resource_id)
);

// Implementation in ControlBuilder
export const logAuditTrail = async (
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    before: any,
    after: any,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    error?: string
) => {
    await auditLogRepository.create({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes: { before, after },
        ip_address: ipAddress,
        user_agent: userAgent,
        result: success ? 'success' : 'failure',
        error_message: error,
        created_at: new Date(),
    });
};

// Usage:
.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(updateUserSchema)
        .setHandler(async (args) => {
            const before = await userRepository.findById(args.params.id);
            const result = await updateUserById.handle(args);
            const after = await userRepository.findById(args.params.id);

            await logAuditTrail(
                args.user.id,
                'USER_UPDATED',
                'user',
                args.params.id,
                before,
                after,
                args.request.ip,
                args.headers['user-agent'],
                true
            );

            return result;
        })
        .handle(),
)
```

---

## ✅ IMPLEMENTATION GUIDE: Audit Logging (Optional Middleware)

### Why Optional?
You want audit logging to be opt-in because:
- Not all endpoints need logging (GET requests don't modify data)
- Some operations are sensitive (password changes, deletions)
- You can conditionally enable/disable globally via environment variables
- Performance: Not capturing logs on every request

### Files to Create

#### 1. `src/core/logging/audit-log.types.ts` (NEW)
```typescript
export type AuditAction =
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'USER_SUSPENDED'
    | 'GIG_CREATED'
    | 'GIG_UPDATED'
    | 'GIG_DELETED'
    | 'PAYMENT_PROCESSED'
    | 'REVIEW_CREATED'
    | 'REVIEW_DELETED'
    | 'REVIEW_MODERATED';

export type ResourceType = 'user' | 'gig' | 'payment' | 'review';

export enum AuditResult {
    SUCCESS = 'success',
    FAILURE = 'failure',
}

export interface AuditLogData {
    id?: string;
    user_id: string;
    action: AuditAction;
    resource_type: ResourceType;
    resource_id: string;
    changes?: {
        before: Record<string, any>;
        after: Record<string, any>;
    };
    ip_address: string;
    user_agent: string;
    result: AuditResult;
    error_message?: string;
    created_at?: Date;
}
```

#### 2. `src/core/logging/audit-log.repository.ts` (NEW)
```typescript
import { BaseRepository } from '@/core/repository';
import { supabaseAdmin } from '@/core/config/database';
import { AuditLogData } from './audit-log.types';

export class AuditLogRepository extends BaseRepository<any, AuditLogData> {
    protected readonly table = 'audit_logs';

    async create(data: AuditLogData): Promise<AuditLogData> {
        const { data: result, error } = await supabaseAdmin
            .from(this.table)
            .insert({
                user_id: data.user_id,
                action: data.action,
                resource_type: data.resource_type,
                resource_id: data.resource_id,
                changes: data.changes || null,
                ip_address: data.ip_address,
                user_agent: data.user_agent,
                result: data.result,
                error_message: data.error_message || null,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return result as AuditLogData;
    }

    async getByUserId(userId: string, limit: number = 100): Promise<AuditLogData[]> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as AuditLogData[];
    }

    async getByResourceId(resourceId: string): Promise<AuditLogData[]> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .select('*')
            .eq('resource_id', resourceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AuditLogData[];
    }
}
```

#### 3. `src/core/logging/audit.service.ts` (NEW)
```typescript
import { AuditLogRepository } from './audit-log.repository';
import { AuditAction, AuditLogData, AuditResult, ResourceType } from './audit-log.types';

export class AuditService {
    private repository = new AuditLogRepository();
    private enabled = process.env.ENABLE_AUDIT_LOGGING !== 'false';

    async log(data: AuditLogData): Promise<void> {
        if (!this.enabled) {
            return; // Silently skip if audit logging is disabled
        }

        try {
            await this.repository.create(data);
        } catch (error) {
            // Don't throw - audit logging failures shouldn't crash the app
            console.error('Failed to log audit trail:', error);
        }
    }

    async logAction(config: {
        userId: string;
        action: AuditAction;
        resourceType: ResourceType;
        resourceId: string;
        ipAddress: string;
        userAgent: string;
        before?: Record<string, any>;
        after?: Record<string, any>;
        success?: boolean;
        errorMessage?: string;
    }): Promise<void> {
        await this.log({
            user_id: config.userId,
            action: config.action,
            resource_type: config.resourceType,
            resource_id: config.resourceId,
            changes: config.before || config.after 
                ? { before: config.before || {}, after: config.after || {} }
                : undefined,
            ip_address: config.ipAddress,
            user_agent: config.userAgent,
            result: config.success !== false ? AuditResult.SUCCESS : AuditResult.FAILURE,
            error_message: config.errorMessage,
        });
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}

export const auditService = new AuditService();
```

#### 4. `src/core/logging/index.ts` (UPDATE - ADD)
```typescript
export * from './audit-log.types';
export * from './audit-log.repository';
export * from './audit.service';
```

### Files to Modify

#### 5. `src/core/handlers/controlBuilder/index.interface.ts` (MODIFY)
**ADD to ControllerHandlerOptions:**
```typescript
export type ControllerHandlerOptions = {
    isPrivate: boolean;
    allowedRoles?: UserRoleEnum[];
    requiredPermissions?: Permission[];
    checkResourceOwnership?: { ... }; // existing
    auditLog?: {
        enabled?: boolean;          // Enable audit logging for this route
        action: AuditAction;        // e.g., 'USER_UPDATED'
        resourceType: ResourceType; // e.g., 'user'
        captureChanges?: boolean;   // Capture before/after (default: true)
    };
};
```

#### 6. `src/core/handlers/controlBuilder/index.builder.ts` (MODIFY)
**ADD imports:**
```typescript
import { AuditAction } from '@/core/logging';
import { ResourceType } from '@/core/logging';
```

**ADD property:**
```typescript
private auditLog?: {
    enabled?: boolean;
    action: AuditAction;
    resourceType: ResourceType;
    captureChanges?: boolean;
};
```

**ADD method to ControlBuilder class:**
```typescript
/**
 * Enable audit logging for this route
 * @param action - The audit action to log
 * @param resourceType - The resource type being affected
 * @param captureChanges - Whether to capture before/after changes (default: true)
 * @returns {ControlBuilder} The instance of this builder for chaining
 */
enableAuditLogging(
    action: AuditAction,
    resourceType: ResourceType,
    captureChanges: boolean = true
) {
    this.auditLog = {
        enabled: true,
        action,
        resourceType,
        captureChanges,
    };
    return this;
}

/**
 * Explicitly disable audit logging
 * @returns {ControlBuilder} The instance of this builder for chaining
 */
disableAuditLogging() {
    this.auditLog = { enabled: false, action: 'USER_CREATED', resourceType: 'user' };
    return this;
}
```

**UPDATE handle() method:**
```typescript
handle() {
    return new ControllerHandler().handle(
        this.handler,
        this.schema,
        {
            ...this.options,
            requiredPermissions: this.requiredPermissions,
            checkResourceOwnership: this.resourceOwnershipCheck,
            auditLog: this.auditLog,
        }
    );
}
```

#### 7. `src/core/handlers/controlBuilder/index.handler.ts` (MODIFY)
**ADD imports at top:**
```typescript
import { auditService } from '@/core/logging';
import { AuditResult } from '@/core/logging';
```

**MODIFY the handle method to wrap execution with audit logging:**
```typescript
handle = (
    controllerFn: AnyFunction,
    schema: ValidationSchema | undefined = {},
    options: ControllerHandlerOptions
): ExpressCallbackFunction => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();
        let success = false;
        let error: Error | null = null;
        let controllerResult: any = null;

        try {
            if (options.isPrivate) {
                await handlePrivateRequest(req, options);
            }

            const controllerArgs = parseIncomingRequest(req);
            if (schema) validateIncomingRequest(schema, controllerArgs);

            // ✅ Capture before state if audit logging enabled
            let beforeState;
            if (options.auditLog?.enabled && options.auditLog?.captureChanges) {
                const resourceId = req.params[
                    (options.checkResourceOwnership?.paramName || 'id')
                ];
                if (resourceId && resourceId !== ':id') {
                    // Fetch resource before modification
                    try {
                        const { supabaseAdmin } = require('@/core/config/database');
                        const { data } = await supabaseAdmin
                            .from(this.getTableName(options.auditLog.resourceType))
                            .select('*')
                            .eq('id', resourceId)
                            .single();
                        beforeState = data;
                    } catch (e) {
                        // Resource not found, OK for CREATE operations
                    }
                }
            }

            controllerResult = await controllerFn(controllerArgs);
            success = true;

            // ✅ Capture after state and log audit trail
            if (options.auditLog?.enabled) {
                const resourceId = req.params[
                    (options.checkResourceOwnership?.paramName || 'id')
                ] || controllerResult?.data?.id || 'unknown';

                let afterState;
                if (options.auditLog?.captureChanges) {
                    try {
                        const { supabaseAdmin } = require('@/core/config/database');
                        const { data } = await supabaseAdmin
                            .from(this.getTableName(options.auditLog.resourceType))
                            .select('*')
                            .eq('id', resourceId)
                            .single();
                        afterState = data;
                    } catch (e) {
                        afterState = controllerResult?.data;
                    }
                }

                await auditService.logAction({
                    userId: req.user?.id || 'anonymous',
                    action: options.auditLog.action,
                    resourceType: options.auditLog.resourceType,
                    resourceId,
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown',
                    before: beforeState,
                    after: afterState,
                    success: true,
                });
            }

            if (!controllerResult) {
                res.status(HttpStatus.OK).send({ status: true });
                return;
            }

            const { code, headers, ...data } = controllerResult;
            res.set({ ...headers })
                .status(code ?? HttpStatus.OK)
                .send(data);
        } catch (err) {
            error = err as Error;
            success = false;

            // ✅ Log failure
            if (options.auditLog?.enabled) {
                const resourceId = req.params[
                    (options.checkResourceOwnership?.paramName || 'id')
                ] || 'unknown';

                await auditService.logAction({
                    userId: req.user?.id || 'anonymous',
                    action: options.auditLog.action,
                    resourceType: options.auditLog.resourceType,
                    resourceId,
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown',
                    success: false,
                    errorMessage: error.message,
                });
            }

            logger.error(`Controller-Handler Error: ${error}`);
            next(error);
        }
    };
};

private getTableName(resourceType: string): string {
    const mapping: Record<string, string> = {
        user: 'users',
        gig: 'gigs',
        review: 'reviews',
        payment: 'payments',
    };
    return mapping[resourceType] || resourceType;
}
```

### Database Migration

#### 8. Create migration: `src/core/database/migrations/[timestamp]-create-audit-logs-table.js`
```javascript
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('audit_logs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
            },
            action: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            resource_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            resource_id: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            changes: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            result: {
                type: Sequelize.ENUM('success', 'failure'),
                defaultValue: 'success',
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
        });

        // Add indexes for fast lookups
        await queryInterface.addIndex('audit_logs', ['user_id', 'created_at']);
        await queryInterface.addIndex('audit_logs', ['resource_type', 'resource_id']);
        await queryInterface.addIndex('audit_logs', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('audit_logs');
    },
};
```

### Usage Examples

#### In `src/api/v1/user/router/user.router.ts`:
```typescript
import { Permission } from '@/core/authorization';

// ✅ WITH audit logging enabled
.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .requirePermissions(Permission.USER_UPDATE)
        .checkResourceOwnership('user')
        .enableAuditLogging('USER_UPDATED', 'user', true)  // Capture changes
        .setValidator(updateUserSchema)
        .setHandler(updateUserById.handle)
        .handle(),
)

// ✅ WITH audit logging disabled (explicitly)
.get(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .disableAuditLogging()  // No logging for reads
        .setValidator(getUserParamsSchema)
        .setHandler(getUserById.handle)
        .handle(),
)

// ✅ Delete with audit logging
.delete(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        .requirePermissions(Permission.USER_DELETE)
        .checkResourceOwnership('user', 'id', true)
        .enableAuditLogging('USER_DELETED', 'user', true)  // Log deletion
        .setValidator(getUserParamsSchema)
        .setHandler(deleteUserById.handle)
        .handle(),
)
```

### Environment Configuration

#### In `.env` or `.env.local`:
```bash
# Enable/disable audit logging globally
ENABLE_AUDIT_LOGGING=true   # Set to 'false' to disable all audit logs
```

### Summary: Files Changed for #4 (Audit Logging)

| File | Action |
|------|--------|
| `src/core/logging/audit-log.types.ts` | Create - Type definitions |
| `src/core/logging/audit-log.repository.ts` | Create - Database operations |
| `src/core/logging/audit.service.ts` | Create - Audit service with enable/disable |
| `src/core/logging/index.ts` | Update - Add exports |
| `src/core/handlers/controlBuilder/index.interface.ts` | Modify - Add `auditLog` option |
| `src/core/handlers/controlBuilder/index.builder.ts` | Modify - Add `enableAuditLogging()` & `disableAuditLogging()` methods |
| `src/core/handlers/controlBuilder/index.handler.ts` | Modify - Wrap execution with audit logging |
| `src/core/database/migrations/[ts]-create-audit-logs.js` | Create - Database table |
| `.env` | Update - Add ENABLE_AUDIT_LOGGING variable |
| All affected router files | Modify - Add `.enableAuditLogging()` to routes needing tracking |

---

### 5. **No Rate Limiting on Auth Endpoints**

**Current (config/ratelimiting.ts)**:

```typescript
export const authRateLimiter = rateLimit({
    // ❌ Probably not applied to endpoints
});
```

**Problem**: Brute force attacks on login, registration, password reset.

**What You Need**:

```typescript
// In ratelimiting.ts
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,    // 15 minutes
    max: 5,                       // 5 attempts
    message: 'Too many login attempts, try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.user != null, // Don't rate limit authenticated users
});

export const passwordResetRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,    // 1 hour
    max: 3,                       // 3 attempts per hour
});

// In auth.router.ts
import { authRateLimiter, passwordResetRateLimiter } from '@/core/config';

authRouter
    .post('/login', authRateLimiter, ControlBuilder.builder()...)
    .post('/register', authRateLimiter, ControlBuilder.builder()...)
    .post('/password-reset', passwordResetRateLimiter, ControlBuilder.builder()...)
```

---

### 6. **Session/Account Lockout Policy**

**Problem**: No protection against compromised accounts or brute force.

**What You Need**:

```typescript
// Add to users table
ALTER TABLE users ADD COLUMN (
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP DEFAULT NULL,
    last_login_at TIMESTAMP,
    last_password_change TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_token_expires TIMESTAMP
);

// Login handler
export const login = async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email);

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
        throw new TooManyRequestsError(
            `Account locked. Try again after ${user.locked_until}`
        );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
        // Increment failed attempts
        await userRepository.update(user.id, {
            failed_login_attempts: user.failed_login_attempts + 1,
        });

        // Lock after 5 failed attempts for 30 mins
        if (user.failed_login_attempts >= 4) {
            await userRepository.update(user.id, {
                locked_until: new Date(Date.now() + 30 * 60 * 1000),
            });
            throw new TooManyRequestsError('Account locked due to multiple failed attempts');
        }

        throw new UnAuthorizedError('Invalid credentials');
    }

    // Reset on successful login
    await userRepository.update(user.id, {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
    });

    return generateTokens(user);
};
```

---

### 7. **No CSRF Protection on State-Changing Operations**

**Current Problem**: POST, PATCH, DELETE requests vulnerable to CSRF.

**What You Need**:

```typescript
// Install: npm install csurf

import csurf from 'csurf';

// Middleware
const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// Apply to state-changing endpoints
userRouter
    .patch('/:id', csrfProtection, ControlBuilder.builder()...)
    .delete('/:id', csrfProtection, ControlBuilder.builder()...)
    .post('/reviews', csrfProtection, ControlBuilder.builder()...)

// Client receives CSRF token on GET requests
.get('/', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
```

---

### 8. **No User Status Enforcement**

**Current**: `status: 'active' | 'suspended'` exists** but never checked**

**What You Need**:

```typescript
// BEFORE: User object
const user = { id, role, email, ... }; // No status check

// AFTER: In handlePrivateRequest
const dbUser = await userRepository.findById(authUser.id);

if (!dbUser) throw new UnAuthorizedError('User profile not found');

// ✅ Add status check
if (dbUser.status === UserStatusEnum.SUSPENDED) {
    throw new ForbiddenError('Your account has been suspended');
}

if (!dbUser.is_verified && options.requiresVerification) {
    throw new ForbiddenError('Please verify your email to access this resource');
}

req.user = { ...authUser, ...dbUser };
```

---

### 9. **No Field-Level Authorization**

**Current**: Can't restrict field visibility based on roles

**What You Need**:

```typescript
// Define which fields each role can see/edit
export const fieldAuthorization = {
    user: {
        talent: {
            view: ['id', 'firstName', 'lastName', 'email', 'bio', 'profileImageUrl', 'onboardingStep'],
            edit: ['firstName', 'lastName', 'bio', 'profileImageUrl', 'phoneNumber'],
            // ❌ Cannot view/edit: role, status, createdAt
        },
        employer: {
            view: ['id', 'firstName', 'lastName', 'email', 'organization', 'website'],
            edit: ['firstName', 'lastName', 'organization', 'website'],
        },
        admin: {
            view: '*', // All fields
            edit: '*',
        },
    },
    gig: {
        talent: {
            view: ['id', 'title', 'description', 'rate', 'status', 'employer_id'],
            edit: [], // Can't edit, only employer can
        },
        employer: {
            view: ['*'],
            edit: ['title', 'description', 'rate', 'status'], // Only own gigs
        },
    },
};

// In response handler
export const filterFieldsByRole = (data: any, resourceType: string, userRole: Role) => {
    const allowedFields = fieldAuthorization[resourceType][userRole].view;
    if (allowedFields === '*') return data;

    return Object.keys(data)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
        }, {});
};

// Usage in handler
const result = await userRepository.findById(id);
const filteredResult = filterFieldsByRole(result, 'user', req.user.role);
return { data: filteredResult };
```

---

### 10. **No HTTP-Only Cookie Strategy**

**Current**: Relies entirely on Authorization header with Bearer token

**Problems**:

-   Vulnerable to XSS attacks (JavaScript can read from headers)
-   Clients might store tokens in localStorage (bad practice)
-   No automatic token refresh

**What You Should Add**:

```typescript
// In app.service.ts, enable cookie support (already done!)
app.use(cookieParser());

// On login
export const login = async (email: string, password: string) => {
    const tokens = await generateTokens(email, password);

    return {
        // Short-lived access token in response (for API calls)
        accessToken: tokens.accessToken,

        // httpOnly Refresh token in cookie (automatic, can't be stolen by XSS)
        // res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: true })
    };
};

// Client behavior
// DO: Send accessToken in Authorization header
// DO: Browser auto-sends refreshToken cookie

// DON'T: Store accessToken in localStorage
// DON'T: Access refreshToken from JavaScript
```

---

### 11. **No Two-Factor Authentication (2FA)**

**Especially Critical For**: Employer accounts managing payments

**What You Need**:

```typescript
// Add to users table
ALTER TABLE users ADD COLUMN (
    two_fa_enabled BOOLEAN DEFAULT false,
    two_fa_secret VARCHAR(255),  // TOTP secret
    two_fa_backup_codes VARCHAR(10)[], // Backup codes
    phone_verified BOOLEAN DEFAULT false
);

// Flow:
.post('/auth/login', authRateLimiter, (req, res) => {
    const user = await validateCredentials(email, password);

    if (user.two_fa_enabled) {
        // Generate temporary session token (5 min expiry)
        const sessionToken = jwt.sign(
            { userId: user.id, stage: '2fa' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        return res.json({
            requiresTwoFactor: true,
            sessionToken,
            method: user.two_fa_method // 'totp' or 'sms'
        });
    }

    const tokens = generateTokens(user);
    return res.json({ accessToken: tokens.accessToken });
});

.post('/auth/verify-2fa', (req, res) => {
    const { sessionToken, code } = req.body;
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);

    if (decoded.stage !== '2fa') throw new UnAuthorizedError('Invalid session');

    const user = await userRepository.findById(decoded.userId);
    const isValid = await verify2FACode(code, user.two_fa_secret);

    if (!isValid) throw new UnAuthorizedError('Invalid 2FA code');

    const tokens = generateTokens(user);
    res.json({ accessToken: tokens.accessToken });
});
```

---

### 12. **No JWT Token Validation**

**Current**: Blindly trusting Supabase tokens

**What You Need**:

```typescript
// BEFORE: In index.utils.ts
const {
    data: { user: authUser },
} = await supabaseAdmin.auth.getUser(token);
// ❌ No signature verification, just trusting Supabase

// AFTER: Validate JWT yourself as backup
import * as jwt from 'jsonwebtoken';

export const validateUserToken = (token: string): DecodedToken => {
    try {
        // Verify signature using Supabase public key
        const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
            algorithms: ['HS256'],
        });

        return decoded as DecodedToken;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new UnAuthorizedError('Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new UnAuthorizedError('Invalid token signature');
        }
        throw new UnAuthorizedError('Token validation failed');
    }
};

// Check in middleware
const authHeader = req.headers.authorization;
const token = authHeader.split(' ')[1];
const decoded = validateUserToken(token); // ✅ Now validates signature
const {
    data: { user },
} = await supabaseAdmin.auth.getUser(token);
```

**Note**: Supabase provides `SUPABASE_JWT_SECRET` in environment. Use it.

---

### 13. **Insufficient Error Messages**

**Current in index.utils.ts**:

```typescript
if (!isRequestAuthorized) throw new ForbiddenError('You do not have access to the requested resource');
```

**Problem**: Same message for "wrong role", "resource not owned", "permission denied" — helps attackers.

**What You Need**:

```typescript
// Create custom error types
export class RoleNotAllowedError extends ForbiddenError {
    constructor(requiredRoles: string[]) {
        super(`This resource requires one of these roles: ${requiredRoles.join(', ')}`);
        this.code = 'ROLE_NOT_ALLOWED';
    }
}

export class PermissionDeniedError extends ForbiddenError {
    constructor(requiredPermissions: string[]) {
        super('You do not have the required permissions');
        this.code = 'PERMISSION_DENIED';
        this.requiredPermissions = requiredPermissions; // Log only, don't expose
    }
}

export class ResourceOwnershipError extends ForbiddenError {
    constructor() {
        super('You can only access your own resources');
        this.code = 'RESOURCE_OWNERSHIP_REQUIRED';
    }
}

// Usage:
if (!user.role) throw new UnAuthorizedError('User role missing');
if (!options.allowedRoles.includes(user.role)) throw new RoleNotAllowedError(options.allowedRoles);
if (!userHasPermission(user, requiredPerm)) throw new PermissionDeniedError([requiredPerm]);
if (resource.user_id !== user.id) throw new ResourceOwnershipError();
```

---

### 14. **No Scope-Based Authorization (OAuth2)**

**If You Plan to Support Third-Party Integrations**:

```typescript
// Add to database
CREATE TABLE api_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token VARCHAR(255),
    name VARCHAR(100),
    scopes VARCHAR(255)[], // ['gigs:read', 'reviews:write']
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP
);

// Scope definition
export enum APIScope {
    GIGS_READ = 'gigs:read',
    GIGS_WRITE = 'gigs:write',
    TALENT_READ = 'talents:read',
    REVIEWS_READ = 'reviews:read',
    REVIEWS_WRITE = 'reviews:write',
    PAYMENTS_READ = 'payments:read',
    PAYMENTS_WRITE = 'payments:write',
}

// Enforce scopes
.get('/gigs', checkAPIToken([APIScope.GIGS_READ]), ...)
.post('/reviews', checkAPIToken([APIScope.REVIEWS_WRITE]), ...)
```

---

### 15. **No IP Whitelisting/Geo-Blocking**

**For High-Risk Operations**:

```typescript
// Add to database
CREATE TABLE ip_whitelist (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    added_at TIMESTAMP,
    last_used_at TIMESTAMP
);

// Middleware for sensitive operations
export const checkIPWhitelist = async (req, res, next) => {
    const user = req.user;
    const ip = req.ip;

    // Only enforce for sensitive roles/operations
    if (user.role === Role.ADMIN || req.path.includes('/payment')) {
        const trusted = await ipWhitelistRepository.findByUserAndIP(user.id, ip);
        if (!trusted) {
            // Send challenge (email verification + 2FA)
            await sendIPVerificationChallenge(user, ip);
            throw new UnAuthorizedError('Unrecognized IP. Verification email sent');
        }
    }
    next();
};

// Apply to sensitive endpoints
.delete('/:id', checkIPWhitelist, ControlBuilder.builder()...)
.post('/payment/process', checkIPWhitelist, ControlBuilder.builder()...)
```

---

### 16. **No Request Signing/Integrity Check**

**For Payment Operations**:

```typescript
// When creating payment request
import crypto from 'crypto';

export const generatePaymentSignature = (data: any, secret: string): string => {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(data))
        .digest('hex');
};

// In payment handler
.post('/payment/process', (req, res) => {
    const signature = req.headers['x-signature'];
    const expectedSignature = generatePaymentSignature(
        req.body,
        process.env.PAYMENT_SIGNING_KEY
    );

    if (signature !== expectedSignature) {
        throw new BadRequestError('Invalid request signature');
    }

    // Process payment
});
```

---

### 17. **No Session Invalidation on Password Change**

**Current**: User changes password, but old tokens still valid

**What You Need**:

```typescript
.post('/auth/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    const isValid = await verifyPassword(oldPassword, user.password_hash);
    if (!isValid) throw new UnAuthorizedError('Current password incorrect');

    const newHash = await hashPassword(newPassword);
    await userRepository.update(user.id, {
        password_hash: newHash,
        password_changed_at: new Date(),
    });

    // Invalidate all tokens issued before now
    await tokenBlacklist.add(user.id, Date.now());

    res.clearCookie('refreshToken');
    res.json({ message: 'Password changed. Please login again' });
});

// Check in middleware
export const handlePrivateRequest = async (req: Request) => {
    const user = req.user;
    const tokenIssuedAt = jwt.decode(token).iat * 1000;
    const lastPasswordChange = user.password_changed_at.getTime();

    if (tokenIssuedAt < lastPasswordChange) {
        throw new UnAuthorizedError('Token invalid after password change');
    }
};
```

---

### 18. **No Database-Level Role Enforcement (Row-Level Security)**

**Current**: Authorization only in application code (vulnerable to bugs)

**What You Need** (Supabase RLS):

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all"
ON users FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    )
);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Similar for gigs, reviews, etc
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gigs viewable to authenticated users"
ON gigs FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Gigs editable only by creator"
ON gigs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Summary Checklist

### ✅ Already Have

-   [ ] Authentication with Supabase
-   [ ] Bearer token validation
-   [ ] Role-based access control
-   [ ] Request validation (Joi)
-   [ ] Error handling
-   [ ] Session support

### 🔴 Critical Missing

-   [ ] **Granular permissions** (not just roles)
-   [ ] **Resource-level authorization** (ownership checks)
-   [ ] **Token refresh mechanism** (no infinite tokens)
-   [ ] **Audit logging** (no activity tracking)
-   [ ] **Account lockout policy** (brute force protection)
-   [ ] **Token blacklist** (logout doesn't revoke)
-   [ ] **User status enforcement** (suspended users can still access)
-   [ ] **JWT signature verification** (not just trusting Supabase)
-   [ ] **2FA for sensitive roles** (employers with payment access)

### ⚠️ Important To Have

-   [ ] Rate limiting on auth endpoints
-   [ ] CSRF protection on state-changing ops
-   [ ] Field-level authorization
-   [ ] HTTP-Only cookie for refresh tokens
-   [ ] Password change → Token invalidation
-   [ ] IP whitelisting for sensitive ops
-   [ ] Database-level RLS (Supabase)
-   [ ] Better error messages (not exposing reasons)
-   [ ] Request signing for payments
-   [ ] Scope-based authorization (if API for 3rd parties)

### 📊 For Scalability

-   [ ] Multi-tenancy isolation (if needed)
-   [ ] Rate limiting per user/IP/endpoint
-   [ ] Token caching strategy
-   [ ] Audit log retention policy
-   [ ] Admin dashboard for suspensions/revocations

---

## Implementation Dependencies & Order

### Feature Dependency Tree

```
┌─ AUTHENTICATION (Already Have)
│  └─ Supabase token validation
│
├─ #1: GRANULAR PERMISSIONS (Independent - do first)
│  ├─ Create: permissions.ts enum
│  ├─ Create: permission.repository.ts
│  └─ Implement in ControlBuilder
│
├─ #2: RESOURCE OWNERSHIP (Depends on #1)  
│  ├─ Create: resource.repository.ts
│  └─ Add to ControlBuilder
│  └─ Use in routers with .checkResourceOwnership()
│
├─ #4: AUDIT LOGGING (Independent - do after #2 if needed)
│  ├─ Create: audit-log.*.ts
│  ├─ Create: audit.service.ts
│  └─ Integrate with ControlBuilder via .enableAuditLogging()
│
├─ #5: RATE LIMITING (Independent - quick win)
│  └─ Apply authRateLimiter middleware to auth routes
│
├─ #3: TOKEN REFRESH (Depends on nothing, but complex)
│  ├─ Needs: Redis for token refresh store
│  ├─ Needs: Token blacklist logic
│  └─ Implement: /auth/refresh endpoint
│
├─ #6: ACCOUNT LOCKOUT (Independent)
│  ├─ Needs: Migration to add failed_login_attempts
│  └─ Add to login handler
│
├─ #8: USER STATUS ENFORCEMENT (Depends on nothing)
│  ├─ Quick add to handlePrivateRequest
│  └─ Two lines of code
│
├─ #12: JWT VALIDATION (Independent)
│  ├─ Add SUPABASE_JWT_SECRET env var
│  └─ Add validateUserToken() function
│
└─ #11: 2FA (Complex - do later)
   ├─ Needs: Migration for 2FA columns
   ├─ Needs: TOTP library
   └─ Needs: Session tokens
```

### Recommended Implementation Phases

**Phase 1: Protection (Week 1)**
```
1. #8: User Status Enforcement (30 mins) - Prevent suspended users
2. #12: JWT Validation (30 mins) - Verify token signatures  
3. #5: Rate Limiting (1 hour) - Protect auth endpoints
```

**Phase 2: Granular Authorization (Week 2)**
```
4. #1: Permissions System (4-6 hours)
   - Create permission enums
   - Add to ControlBuilder
   - Update all routers
   
5. #2: Resource Ownership (3-4 hours)
   - Create resource repository
   - Add ownership checks
   - Update state-changing endpoints
```

**Phase 3: Audit & Accountability (Week 3)**
```
6. #4: Audit Logging (4 hours)
   - Create audit service
   - Integrate with ControlBuilder
   - Add to critical endpoints
   
7. #6: Account Lockout (2 hours)
   - Add migration
   - Implement login logic
```

**Phase 4: Token Security (Week 4)**
```
8. #3: Token Refresh (6-8 hours)
   - Implement refresh token logic
   - Redis integration
   - Update login/logout/refresh endpoints
   
9. #17: Password Change Invalidation (2 hours)
   - Add token blacklist check
```

**Phase 5: Advanced (Later)**
```
10. #11: 2FA (8-10 hours) - Employer protection
11. #9: Field-Level Auth (4-5 hours) - Data visibility
12. #15: IP Whitelisting (4 hours) - Account takeover prevention
```

---

## Priority Implementation Order

1. **Week 1-2**: Permissions system, resource ownership, token refresh
2. **Week 2-3**: Audit logging, user status enforcement, account lockout
3. **Week 3**: Token invalidation, 2FA design
4. **Week 4**: RLS policies, rate limiting, field-level auth
5. **Later**: Scopes, IP whitelisting, advanced monitoring
