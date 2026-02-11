import { dispatch } from '@/app';
import { BadRequestError, BaseService, ConflictError, ControllerArgs, HttpStatus, logger } from '@/core';
import { UserRepository } from '~/user/repository';
import { SetUserRolePayload } from '../../interface';

export class SetUserRole extends BaseService {
    constructor(private readonly userRepository: UserRepository) {
        super();
    }

    handle = async ({ input }: ControllerArgs<SetUserRolePayload>) => {
        if (!input) throw new BadRequestError(`Invalid credentials`);

        const { role, userId } = input;

        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new ConflictError('User not found.');
        }

        if (user.role == role) {
            throw new ConflictError('User role already set.');
        }

        await this.userRepository.updateById(userId, { role });

        if (role == 'talent') {
            const [talent] = await dispatch('talent:create-talent', { user_id: userId });

            if (!talent) throw new Error('Failed to create talent profile');
        }

        logger.info('User Account Created Successfully');

        return {
            data: user,
            code: HttpStatus.CREATED,
            message: 'User Role Set Successfully',
        };
    };
}

const setUserRoleInstance = new SetUserRole(new UserRepository());

export default setUserRoleInstance;
