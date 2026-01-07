import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { GetUsersQueryDto } from '@user/interfaces';
import { UserRepository } from '@user/repository';

export class GetAllUsers {
    constructor(private readonly userRepository: UserRepository) {}

    handle = async (payload: ControllerArgs<GetUsersQueryDto>) => {
        const { query } = payload;

        const allUser = await this.userRepository.getAllUsers(query);

        if (!allUser) throw new BadRequestError('Invalid user ID');

        return {
            code: HttpStatus.OK,
            message: 'Users Fetched Successfully',
            data: allUser,
        };
    };
}

const getAllUsers = new GetAllUsers(new UserRepository());

export default getAllUsers;
