import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { UpsertEmployerProfileDto } from '~/employers/interfaces';
import { EmployerRepository } from '~/employers/repository';

export class UpsertEmployerProfile {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ input, request }: ControllerArgs<UpsertEmployerProfileDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const profile = await this.employerRepository.upsertEmployerProfile(userId, input ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Employer Profile Updated Successfully',
            data: profile,
        };
    };
}

const upsertEmployerProfile = new UpsertEmployerProfile(new EmployerRepository());

export default upsertEmployerProfile;
