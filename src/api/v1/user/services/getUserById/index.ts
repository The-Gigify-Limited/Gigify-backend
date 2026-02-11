import { dispatch } from '@/app';
import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { GetUserParamsDto, User } from '~/user/interfaces';
import { UserRepository } from '~/user/repository';

export class GetUserById {
    constructor(private readonly userRepository: UserRepository) {}

    handle = async (payload: ControllerArgs<GetUserParamsDto>) => {
        const { params, query } = payload;

        if (!params) throw new BadRequestError(`Invalid user ID`);

        const { id } = params;

        let user: User | null = null;

        const existingUser = await this.userRepository.findById(id);

        if (!existingUser) throw new BadRequestError('Invalid user ID');

        const convertedUser = this.userRepository.mapToCamelCase(existingUser);

        if (convertedUser) user = convertedUser;

        let talentProfile = undefined;

        if (query?.full_profile && user) {
            if (user.role === 'talent') {
                const [talent] = await dispatch('talent:get-talent-profile', { user_id: id });

                if (talent) talentProfile = talent;
            }
        }

        return {
            code: HttpStatus.OK,
            message: 'User Fetched Successfully',
            data: {
                user,
                talentProfile,
            },
        };
    };
}

const getUserById = new GetUserById(new UserRepository());

export default getUserById;
