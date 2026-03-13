jest.mock('@/core', () => {
    class BaseRepository {}
    class RouteNotFoundError extends Error {}
    class ServerError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BaseRepository,
        HttpStatus: { CREATED: 201 },
        RouteNotFoundError,
        ServerError,
        UnAuthorizedError,
    };
});

jest.mock('../../utils/sumsub', () => ({
    createSumsubApplicant: jest.fn().mockResolvedValue({
        id: 'sumsub-applicant-1',
        levelName: 'gigify-basic-kyc',
    }),
    createSumsubSdkAccessToken: jest.fn().mockResolvedValue({
        token: 'sumsub-sdk-token',
        userId: 'user-1',
        ttlInSecs: 600,
        levelName: 'gigify-basic-kyc',
    }),
    getSumsubApplicantByExternalUserId: jest.fn().mockResolvedValue(null),
}));

import { CreateKycSession } from './index';

describe('CreateKycSession service', () => {
    it('creates a Sumsub applicant, stores the verification, and returns an SDK token', async () => {
        const identityVerificationRepository = {
            getLatestByUserIdAndProvider: jest.fn().mockResolvedValue(null),
            createProviderVerification: jest.fn().mockResolvedValue({
                id: 'verification-1',
                providerApplicantId: 'sumsub-applicant-1',
                status: 'pending',
            }),
            updateVerification: jest.fn(),
        };
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'ada@example.com',
                first_name: 'Ada',
                last_name: 'Lovelace',
                phone_number: '+2348012345678',
                onboarding_step: 1,
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'user-1',
                email: 'ada@example.com',
                firstName: 'Ada',
                lastName: 'Lovelace',
                phoneNumber: '+2348012345678',
                onboardingStep: 1,
            }),
            updateById: jest.fn().mockResolvedValue(undefined),
        };

        const service = new CreateKycSession(identityVerificationRepository as never, userRepository as never);

        const response = await service.handle({
            input: {},
            request: {
                user: {
                    id: 'user-1',
                },
            },
        } as never);

        expect(identityVerificationRepository.createProviderVerification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-1',
                providerApplicantId: 'sumsub-applicant-1',
                provider: 'sumsub',
            }),
        );
        expect(userRepository.updateById).toHaveBeenCalledWith('user-1', {
            onboardingStep: 3,
        });
        expect(response.message).toBe('KYC Session Created Successfully');
        expect(response.data.session.token).toBe('sumsub-sdk-token');
    });
});
