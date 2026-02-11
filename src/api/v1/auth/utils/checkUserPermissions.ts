import { ForbiddenError } from '@/core';
import { Permission } from '../interface';
import { PermissionRepository } from '../repository';

export const checkPermissions = async (userId: string, requiredPermissions?: Permission[]): Promise<void> => {
    const permissionRepository = new PermissionRepository();
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return;
    }

    const hasAllPermissions = await permissionRepository.checkPermissions(userId, requiredPermissions);

    if (!hasAllPermissions) {
        throw new ForbiddenError('You do not have the required permissions to perform this action');
    }
};
