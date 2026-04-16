jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('@/core', () => {
    class BaseService {
        supabase = {};
    }

    class BadRequestError extends Error {}
    class ConflictError extends Error {}

    return {
        BadRequestError,
        BaseService,
        ConflictError,
        HttpStatus: { CREATED: 201 },
        logger: {
            error: jest.fn(),
            info: jest.fn(),
        },
    };
});

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

jest.mock('@/core/services/mails', () => ({
    sendEmail: jest.fn(),
    welcomeOnboardingMail: jest.fn().mockReturnValue('<html>welcome</html>'),
    welcomeEmployerMail: jest.fn().mockReturnValue('<html>employer welcome</html>'),
}));

import { dispatch } from '@/app';
import { sendEmail, welcomeOnboardingMail } from '@/core/services/mails';
import { SetUserRole } from './index';

describe('SetUserRole service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('updates the role, sets onboarding, and sends the welcome email for talents', async () => {
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
                role: null,
                onboarding_step: 0,
            }),
            updateById: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                first_name: 'Ada',
                role: 'talent',
                onboarding_step: 1,
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
                role: 'talent',
                onboardingStep: 1,
            }),
        };

        (dispatch as jest.Mock).mockResolvedValue([{ id: 'talent-profile-1' }]);

        const service = new SetUserRole(userRepository as never, sendEmail as never);

        const response = await service.handle({
            input: {
                userId: 'user-1',
                role: 'talent',
            },
        } as never);

        expect(userRepository.updateById).toHaveBeenCalledWith('user-1', {
            role: 'talent',
            onboardingStep: 1,
        });
        expect(dispatch).toHaveBeenCalledWith('talent:create-talent', { user_id: 'user-1' });
        expect(welcomeOnboardingMail).toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'ada@example.com',
            }),
        );
        expect(response.data.role).toBe('talent');
        expect(response.data.onboardingStep).toBe(1);
    });

    it('sends employer welcome email when role is employer', async () => {
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'employer@example.com',
                firstName: 'Sarah',
                role: null,
                onboarding_step: 0,
            }),
            updateById: jest.fn().mockResolvedValue({
                id: 'user-1',
                role: 'employer',
                onboarding_step: 1,
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'user-1',
                email: 'employer@example.com',
                firstName: 'Sarah',
                role: 'employer',
                onboardingStep: 1,
            }),
        };

        (dispatch as jest.Mock).mockResolvedValue([{ id: 'employer-profile-1' }]);

        const service = new SetUserRole(userRepository as never, sendEmail as never);

        const response = await service.handle({
            input: { userId: 'user-1', role: 'employer' },
        } as never);

        expect(dispatch).toHaveBeenCalledWith('employer:create-profile', { user_id: 'user-1' });
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'employer@example.com' }));
        expect(response.data.role).toBe('employer');
    });

    it('does not block role assignment if the welcome email fails', async () => {
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
                role: null,
                onboarding_step: 0,
            }),
            updateById: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                first_name: 'Ada',
                role: 'talent',
                onboarding_step: 1,
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
                role: 'talent',
                onboardingStep: 1,
            }),
        };

        (dispatch as jest.Mock).mockResolvedValue([{ id: 'talent-profile-1' }]);
        (sendEmail as jest.Mock).mockRejectedValue(new Error('mail failed'));

        const service = new SetUserRole(userRepository as never, sendEmail as never);

        const response = await service.handle({
            input: {
                userId: 'user-1',
                role: 'talent',
            },
        } as never);

        expect(response.message).toBe('User Role Set Successfully');
        expect(sendEmail).toHaveBeenCalled();
    });
});
