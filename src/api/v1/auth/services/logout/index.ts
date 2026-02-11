import { BaseService, ControllerArgs, HttpStatus, logger, UnAuthorizedError } from '@/core';

export class Logout extends BaseService {
    handle = async ({ user, request }: ControllerArgs) => {
        if (!user?.id) {
            throw new UnAuthorizedError('User not authenticated');
        }

        const { error } = await this.supabase.auth.admin.signOut(user.id);

        if (error) {
            logger.error('Supabase logout failed', {
                userId: user.id,
                error: error.message,
            });

            throw new Error('Logout failed. Please try again.');
        }

        request.user = null;

        logger.info('User logged out successfully', {
            userId: user.id,
        });

        return {
            data: null,
            code: HttpStatus.OK,
            message: 'Logout successful',
        };
    };
}

const logoutInstance = new Logout();

export default logoutInstance;
