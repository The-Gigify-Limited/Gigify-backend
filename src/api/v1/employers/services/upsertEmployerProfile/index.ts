import { BadRequestError, ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { UpsertEmployerProfileDto } from '~/employers/interfaces';
import { EmployerRepository } from '~/employers/repository';

export class UpsertEmployerProfile {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ input, params, request }: ControllerArgs<UpsertEmployerProfileDto>) => {
        const authUserId = request.user?.id;

        const profile = await this.employerRepository.upsertEmployerProfile(params.id, input ?? {});
        const totalApplicationsReceived = await this.employerRepository.countTotalApplicationsReceived(params.id);

        return {
            code: HttpStatus.OK,
            message: 'Employer Profile Updated Successfully',
            data: {
                ...profile,
                totalApplicationsReceived,
            },
        };
    };
}

const upsertEmployerProfile = new UpsertEmployerProfile(new EmployerRepository());

export default upsertEmployerProfile;
