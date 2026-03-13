import { BadRequestError, BaseService, ControllerArgs, HttpStatus, ServerError, logger } from '@/core';
import { UserRepository } from '~/user/repository';
import { GoogleAuthCodeExchangePayload } from '../../interface';
import { mapSupabaseAuthError } from '../../utils';

export class ExchangeGoogleAuthCode extends BaseService {
    constructor(private readonly userRepository: Pick<UserRepository, 'upsertAuthUserIdentity'> = new UserRepository()) {
        super();
    }

    handle = async ({ input }: ControllerArgs<GoogleAuthCodeExchangePayload>) => {
        if (!input?.code) throw new BadRequestError('Google authorization code is required');

        const { data, error } = await this.supabase.auth.exchangeCodeForSession(input.code);

        if (error) {
            logger.error('Google auth code exchange failed', {
                error: error.message,
                status: error.status,
                code: error.code,
            });

            mapSupabaseAuthError(error, 'Unable to complete Google sign in right now.');
        }

        if (!data.user?.id || !data.session) {
            throw new ServerError('Supabase did not return a usable session after Google authentication.');
        }

        const profile = await this.userRepository.upsertAuthUserIdentity({
            id: data.user.id,
            email: data.user.email ?? null,
            phoneNumber: data.user.phone ?? null,
        });

        logger.info('Google authentication completed successfully', {
            userId: data.user.id,
            email: data.user.email ?? null,
        });

        return {
            code: HttpStatus.OK,
            message: 'Google authentication completed successfully',
            data: {
                user: data.user,
                session: data.session,
                profile,
            },
        };
    };
}

const exchangeGoogleAuthCode = new ExchangeGoogleAuthCode();
export default exchangeGoogleAuthCode;
