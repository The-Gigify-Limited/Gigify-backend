import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { GetUserParamsDto } from '~/user/interfaces';
import { UserRepository } from '~/user/repository';

export class DeleteUser {
    constructor(private readonly userRepository: UserRepository) {}

    handle = async (payload: ControllerArgs<GetUserParamsDto>) => {
        const { params } = payload;

        if (!params) throw new BadRequestError(`Invalid user ID`);

        const { id } = params;

        await this.userRepository.deleteUser(id);

        return {
            code: HttpStatus.NO_CONTENT,
            message: 'User Deleted Successfully',
        };
    };
}

const deleteUser = new DeleteUser(new UserRepository());

export default deleteUser;
