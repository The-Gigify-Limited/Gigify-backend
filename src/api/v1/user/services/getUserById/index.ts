import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { GetUserParamsDto, User } from '@user/interfaces';
import { UserRepository } from '@user/repository';

export class GetUserById {
    constructor(private readonly userRepository: UserRepository) {}

    handle = async (payload: ControllerArgs<GetUserParamsDto>) => {
        const { params } = payload;

        if (!params) throw new BadRequestError(`Invalid user ID`);

        const { id } = params;

        let user: User | null = null;

        const existingUser = await this.userRepository.findById(id);

        if (!existingUser) throw new BadRequestError('Invalid user ID');

        const convertedUser = this.userRepository.mapToCamelCase(existingUser);

        if (convertedUser) user = convertedUser;

        return {
            code: HttpStatus.OK,
            message: 'User Fetched Successfully',
            data: user,
        };
    };
}

const getUserById = new GetUserById(new UserRepository());

export default getUserById;
