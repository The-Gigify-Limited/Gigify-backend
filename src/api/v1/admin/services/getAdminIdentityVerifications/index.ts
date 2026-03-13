import { ControllerArgs, HttpStatus } from '@/core';
import { IdentityVerificationRepository } from '~/user/repository';
import { AdminIdentityVerificationQueryDto } from '../../interfaces';

export class GetAdminIdentityVerifications {
    constructor(private readonly identityVerificationRepository: IdentityVerificationRepository) {}

    handle = async ({ query }: ControllerArgs<AdminIdentityVerificationQueryDto>) => {
        const verifications = await this.identityVerificationRepository.getAll(query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Identity Verifications Retrieved Successfully',
            data: verifications,
        };
    };
}

const getAdminIdentityVerifications = new GetAdminIdentityVerifications(new IdentityVerificationRepository());
export default getAdminIdentityVerifications;
