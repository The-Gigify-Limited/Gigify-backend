import { dispatch } from '@/app';
import { BadRequestError, BaseService, ConflictError, ControllerArgs, HttpStatus, logger } from '@/core';
import { UserRepository } from '~/user/repository';
import { SignupPayload } from '../../interface';
import { mapSupabaseAuthError } from '../../utils';

export class Register extends BaseService {
    constructor(private readonly userRepository: UserRepository) {
        super();
    }

    handle = async ({ input }: ControllerArgs<SignupPayload>) => {
        if (!input) throw new BadRequestError(`Invalid credentials`);

        const { email, password } = input;
        const normalizedEmail = email.toLowerCase();

        const userExists = await this.userRepository.findByEmail(normalizedEmail);

        if (userExists) {
            throw new ConflictError('User already exists. Please log in instead.');
        }

        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            logger.error('Supabase sign-up failed', {
                email: normalizedEmail,
                error: error.message,
                status: error.status,
                code: error.code,
            });

            mapSupabaseAuthError(error, 'Registration failed. Please try again later.');
        }

        await this.userRepository.createUserPreSignup(data.user?.id!, normalizedEmail);

 

        logger.info('User Account Created Successfully');

        return {
            data: data.user,
            code: HttpStatus.CREATED,
            message: 'User Created Successfully',
        };
    };
}

const registerInstance = new Register(new UserRepository());

export default registerInstance;
