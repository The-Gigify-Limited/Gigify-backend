import { BadRequestError, BaseService, ControllerArgs, HttpStatus, logger } from '@/core';
import { RefreshTokenPayload } from '../../interface';
import { mapSupabaseAuthError } from '../../utils';

export class RefreshToken extends BaseService {
    handle = async ({ input }: ControllerArgs<RefreshTokenPayload>) => {
        if (!input) throw new BadRequestError('Refresh token is required');

        const { refreshToken } = input;

        if (!refreshToken) {
            throw new BadRequestError('Refresh token is required');
        }

        const { data, error } = await this.supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error) {
            logger.error('Supabase token refresh failed', {
                error: error.message,
                status: error.status,
                code: error.code,
            });

            mapSupabaseAuthError(error, 'Token refresh failed. Please login again.');
        }

        logger.info('Token Refreshed Successfully', {
            userId: data.user?.id,
        });

        return {
            data: {
                user: data.user,
                accessToken: data.session?.access_token,
                refreshToken: data.session?.refresh_token,
            },
            code: HttpStatus.OK,
            message: 'Token refreshed successfully',
        };
    };
}

const refreshTokenInstance = new RefreshToken();

export default refreshTokenInstance;
