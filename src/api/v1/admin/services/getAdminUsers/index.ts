import { ControllerArgs, HttpStatus } from '@/core';
import { AdminUsersQueryDto } from '../../interfaces';
import { AdminRepository } from '../../repository';

export class GetAdminUsers {
    constructor(private readonly adminRepository: AdminRepository) {}

    handle = async ({ query }: ControllerArgs<AdminUsersQueryDto>) => {
        const users = await this.adminRepository.getUsers(query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Admin Users Retrieved Successfully',
            data: users,
        };
    };
}

const getAdminUsers = new GetAdminUsers(new AdminRepository());
export default getAdminUsers;
