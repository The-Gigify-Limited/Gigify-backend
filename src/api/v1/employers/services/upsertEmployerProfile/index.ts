import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { UpsertEmployerProfileDto } from '~/employers/interfaces';
import { EmployerRepository } from '~/employers/repository';

export class UpsertEmployerProfile {
    constructor(private readonly employerRepository: EmployerRepository) {}

    handle = async ({ input, params }: ControllerArgs<UpsertEmployerProfileDto>) => {
        if (!params?.id) throw new BadRequestError('No User ID Found!');

        const profile = await this.employerRepository.upsertEmployerProfile(params.id, input ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Employer Profile Updated Successfully',
            data: profile,
        };
    };
}

const upsertEmployerProfile = new UpsertEmployerProfile(new EmployerRepository());

export default upsertEmployerProfile;
