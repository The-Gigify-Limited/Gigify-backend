import { BaseService, ControllerArgs, HttpStatus, logger, UnAuthorizedError } from '@/core';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/core/config';
import { blacklistToken } from '~/auth/utils';

export class Logout extends BaseService {
    handle = async ({ user, request }: ControllerArgs) => {
        if (!user?.id) {
            throw new UnAuthorizedError('User not authenticated');
        }

        const token = request.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new UnAuthorizedError('No access token provided');
        }

        const userClient = createClient(config.db.supabaseUrl, config.db.supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { error } = await userClient.auth.signOut();

        if (error) {
            logger.error('Supabase logout failed', {
                userId: user.id,
                error: error.message,
            });

            throw new Error('Logout failed. Please try again.');
        }

        await blacklistToken(token);

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
