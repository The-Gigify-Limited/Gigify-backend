import { BadRequestError, BaseService, config, ControllerArgs, HttpStatus, ServerError, logger } from '@/core';
import { GoogleAuthUrlPayload } from '../../interface';
import { mapSupabaseAuthError } from '../../utils';

export class GetGoogleAuthUrl extends BaseService {
    handle = async ({ input }: ControllerArgs<GoogleAuthUrlPayload>) => {
        const redirectTo = input?.redirectTo?.trim() || config.auth.googleOAuthRedirectUrl?.trim() || undefined;

        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: redirectTo
                ? {
                      redirectTo,
                  }
                : undefined,
        });

        if (error) {
            logger.error('Google OAuth URL generation failed', {
                redirectTo,
                error: error.message,
                status: error.status,
                code: error.code,
            });

            mapSupabaseAuthError(error, 'Unable to start Google sign in right now.');
        }

        if (!data?.url) {
            throw new ServerError('Supabase did not return a usable Google authentication URL.');
        }

        logger.info('Google OAuth URL generated successfully', {
            redirectTo: redirectTo ?? null,
        });

        return {
            code: HttpStatus.OK,
            message: 'Google authentication URL generated successfully',
            data: {
                provider: 'google',
                url: data.url,
                redirectTo: redirectTo ?? null,
            },
        };
    };
}

const getGoogleAuthUrl = new GetGoogleAuthUrl();
export default getGoogleAuthUrl;
