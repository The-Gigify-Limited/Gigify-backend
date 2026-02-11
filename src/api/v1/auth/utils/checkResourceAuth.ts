import { ForbiddenError } from '@/core';
import { User } from '~/user/interfaces';
import { Resources } from '../interface';
import { ResourceRepository } from '../repository';

export const verifyResourceOwnership = async (
    user: Partial<User>,
    resourceType: Resources,
    resourceId: string,
    adminCanBypass?: boolean,
): Promise<void> => {
    const resourceRepository = new ResourceRepository();

    if (adminCanBypass && user.role === 'admin') {
        return;
    }

    const isOwner = await resourceRepository.isResourceOwner(user.id!, resourceType, resourceId);

    if (!isOwner) {
        throw new ForbiddenError('You can only access your own resources');
    }
};
