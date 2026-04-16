import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { GigRepository } from '~/gigs/repository';
import { AdminGigStatusUpdateDto } from '../../interfaces';

export class UpdateAdminGigStatus {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<AdminGigStatusUpdateDto>) => {
        const adminId = request.user?.id;

        if (!adminId) throw new UnAuthorizedError('User not authenticated');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');

        const updatedGig = await this.gigRepository.updateGigById(gig.id, {
            status: input.status,
        });

        await auditService.log({
            userId: adminId,
            action: 'admin_gig_status_updated',
            resourceType: 'gig',
            resourceId: gig.id,
            changes: {
                status: input.status,
            },
            ipAddress: request.ip ?? null,
            userAgent: Array.isArray(request.headers['user-agent'])
                ? request.headers['user-agent'][0] ?? null
                : request.headers['user-agent'] ?? null,
        });

        return {
            code: HttpStatus.OK,
            message: 'Gig Status Updated Successfully',
            data: updatedGig,
        };
    };
}

const updateAdminGigStatus = new UpdateAdminGigStatus(new GigRepository());
export default updateAdminGigStatus;
