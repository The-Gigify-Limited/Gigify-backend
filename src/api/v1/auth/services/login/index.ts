import { BadRequestError, BaseService, ControllerArgs, HttpStatus, logger } from '@/core';
import { LoginPayload } from '../../interface';
import { mapSupabaseAuthError } from '../../utils';

export class Login extends BaseService {
    handle = async ({ input }: ControllerArgs<LoginPayload>) => {
        if (!input) throw new BadRequestError('Invalid credentials');

        const { email, password } = input;

        const normalizedEmail = email.toLowerCase();

        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
        });

        if (error) {
            logger.error('Supabase login failed', {
                email: normalizedEmail,
                error: error.message,
                status: error.status,
                code: error.code,
            });

            mapSupabaseAuthError(error, 'Login failed. Please try again later.');
        }

        logger.info('User Logged In Successfully', {
            userId: data.user?.id,
            email: normalizedEmail,
        });

        return {
            data: {
                user: data.user,
                accessToken: data.session?.access_token,
                refreshToken: data.session?.refresh_token,
            },
            code: HttpStatus.OK,
            message: 'Login successful',
        };
    };
}

const loginInstance = new Login();

export default loginInstance;
