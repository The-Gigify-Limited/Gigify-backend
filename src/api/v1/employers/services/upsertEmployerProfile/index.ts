import { BadRequestError, ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { UpsertEmployerProfileDto } from '~/employers/interfaces';
import { EmployerRepository } from '~/employers/repository';

export class UpsertEmployerProfile {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ input, params, request }: ControllerArgs<UpsertEmployerProfileDto>) => {
        const authUserId = request.user?.id;

        if (!authUserId) throw new UnAuthorizedError('User not authenticated');

        const userId = params?.id ?? authUserId;

        if (userId !== authUserId) throw new BadRequestError('You can only update your own profile');

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
