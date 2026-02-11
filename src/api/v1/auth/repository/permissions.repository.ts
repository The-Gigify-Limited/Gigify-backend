import { dispatch } from '@/app';
import { supabaseAdmin } from '@/core/config/database';
import { BaseRepository } from '@/core/repository';
import { Permission, Role, rolePermissions } from '../interface';

export class PermissionRepository extends BaseRepository<any, any> {
    protected readonly table = 'role_permissions';

    async getRolePermissions(role: Role): Promise<Permission[]> {
        const { data } = await supabaseAdmin.from(this.table).select('permission').eq('role', role);

        if (data && data.length > 0) {
            return data.map((r) => r.permission as Permission);
        }

        return rolePermissions[role] || [];
    }

    async hasPermission(userId: string, permission: Permission): Promise<boolean> {
        const [user] = await dispatch('user:get-by-id', { id: userId, fields: ['role'] });

        if (!user) return false;

        const userPermissions = await this.getRolePermissions(user.role as Role);
        return userPermissions.includes(permission);
    }

    async checkPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
        const [user] = await dispatch('user:get-by-id', { id: userId, fields: ['role'] });

        if (!user) return false;

        const userPermissions = await this.getRolePermissions(user.role as Role);
        return permissions.every((perm) => userPermissions.includes(perm));
    }
}
