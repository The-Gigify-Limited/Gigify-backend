# RBAC Engine Integration Plan for Gigify

## 1. Database Schema (Supabase/PostgreSQL)

Since `rbac-engine` relies on storing Policies and Roles, we need to create the underlying tables in Postgres. We will use `JSONB` for the policy documents to keep them flexible.

Run this SQL in your Supabase SQL Editor:

```sql
-- 1. Roles Table
CREATE TABLE public.rbac_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Policies Table (Stores the IAM-style JSON)
CREATE TABLE public.rbac_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- Added name for easier lookup
    document JSONB NOT NULL,   -- The actual PolicyDocument
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Junction: Users <-> Roles
CREATE TABLE public.rbac_user_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.rbac_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. Junction: Roles <-> Policies
CREATE TABLE public.rbac_role_policies (
    role_id UUID NOT NULL REFERENCES public.rbac_roles(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES public.rbac_policies(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, policy_id)
);

-- 5. Junction: Users <-> Policies (Direct attachment)
CREATE TABLE public.rbac_user_policies (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES public.rbac_policies(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, policy_id)
);

-- Enable RLS (Optional but recommended, though the Service Role will bypass it)
ALTER TABLE public.rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_role_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_user_policies ENABLE ROW LEVEL SECURITY;
```

## 2. The Supabase Adapter (`SupabaseRepository.ts`)

You need to implement the `IBaseRepository` interface. This serves as the bridge.

**File:** `src/core/security/SupabaseRepository.ts`

```typescript
import { IBaseRepository, User, Role, Policy } from 'rbac-engine';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseRepository implements IBaseRepository {
  constructor(private supabase: SupabaseClient) {}

  // --- User Methods ---
  
  async createUser(user: User): Promise<User> {
    // Users are managed by Supabase Auth, so we might just ensure they exist or do nothing
    // This method might be a no-op if you rely strictly on auth.users
    return user; 
  }

  async getUser(userId: string): Promise<User> {
    // Fetch user basic info + Roles + Policies
    // This requires a join query
    const { data: userRoles } = await this.supabase
      .from('rbac_user_roles')
      .select('role_id')
      .eq('user_id', userId);
      
    const { data: userPolicies } = await this.supabase
      .from('rbac_user_policies')
      .select('policy_id')
      .eq('user_id', userId);

    return {
        id: userId,
        name: 'Supabase User', // Fetch real name if needed from profiles
        roles: userRoles?.map(r => r.role_id) || [],
        policies: userPolicies?.map(p => p.policy_id) || []
    };
  }

  // --- Role Methods ---

  async createRole(role: Role): Promise<Role> {
    const { data, error } = await this.supabase
        .from('rbac_roles')
        .insert({ id: role.id, name: role.name })
        .select()
        .single();
    
    if (error) throw error;
    return { id: data.id, name: data.name, policies: [] };
  }

  async getRole(roleId: string): Promise<Role> {
     const { data: role, error } = await this.supabase
        .from('rbac_roles')
        .select('*')
        .eq('id', roleId)
        .single();
        
     if (error) throw error;

     // Fetch attached policies
     const { data: policies } = await this.supabase
        .from('rbac_role_policies')
        .select('policy_id')
        .eq('role_id', roleId);

     return {
         id: role.id,
         name: role.name,
         policies: policies?.map(p => p.policy_id) || []
     };
  }

  // ... (Implement updateRole, deleteRole similarly)

  // --- Policy Methods ---

  async createPolicy(policy: Policy): Promise<Policy> {
    const { data, error } = await this.supabase
        .from('rbac_policies')
        .insert({ 
            id: policy.id, 
            document: policy.document 
        })
        .select()
        .single();

    if (error) throw error;
    return { id: data.id, document: data.document };
  }

  async getRolePolicies(roleId: string): Promise<Policy[]> {
      // Join rbac_role_policies -> rbac_policies
      const { data, error } = await this.supabase
        .from('rbac_role_policies')
        .select('policy:rbac_policies(*)')
        .eq('role_id', roleId);
        
      if (error) throw error;
      
      // Transform Supabase response to Policy[]
      return data.map((row: any) => ({
          id: row.policy.id,
          document: row.policy.document
      }));
  }

  // ... (Implement attachPolicyToRole, assignRoleToUser, etc.)
  // These are straightforward INSERTs into the junction tables.
}
```

## 3. Initialization & Middleware

**File:** `src/core/security/rbac.ts`

```typescript
import { AccessControl } from 'rbac-engine';
import { createClient } from '@supabase/supabase-js';
import { SupabaseRepository } from './SupabaseRepository';

// Use the Service Role Key to bypass RLS for permission checks
const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const repository = new SupabaseRepository(supabaseAdmin);
export const rbac = new AccessControl(supabaseAdmin, SupabaseRepository);

// Initialize (Optional, if the lib requires it)
// await rbac.init(); 
```

## 4. Using it in ControlBuilder

Now you can integrate it into your existing builder.

**File:** `src/core/handlers/controlBuilder/index.builder.ts`

```typescript
import { rbac } from '@core/security/rbac';

export class ControlBuilder {
    // ... existing code ...

    public can(action: string, resource: string) {
        this.options.permissionCheck = async (req) => {
            const userId = req.user.id;
            
            // The Power of RBAC Engine:
            // "resource" can be dynamic, e.g., "gig/123"
            // You can construct the resource string from params
            const resourceId = req.params.id ? `${resource}/${req.params.id}` : resource;

            const hasAccess = await rbac.hasAccess(userId, action, resourceId);
            
            if (!hasAccess) {
                throw new ForbiddenError(`Permission denied: Cannot ${action} on ${resourceId}`);
            }
        };
        return this;
    }
}
```

## 5. Usage in Router

```typescript
// user.router.ts

.patch(
    '/:id',
    ControlBuilder.builder()
        .isPrivate()
        // Check if user has "update" permission on "user/{id}"
        // The RBAC Engine will check policies for "user/*" or specific "user/123"
        .can('update', 'user') 
        .setHandler(updateUserById.handle)
        .handle()
)
```

## Summary of Work Required

1.  **Install**: `npm install rbac-engine`
2.  **SQL**: Run the 5 `CREATE TABLE` statements.
3.  **Code**:
    *   Create `src/core/security/SupabaseRepository.ts` (Approx 150 lines of code).
    *   Update `ControlBuilder` to use `rbac.hasAccess()`.
    *   Seed initial Policies (Admin, User) using a script.
