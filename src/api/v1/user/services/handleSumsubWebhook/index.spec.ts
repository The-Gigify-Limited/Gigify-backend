jest.mock('@/core', () => {
    class BaseRepository {}
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        BaseRepository,
        HttpStatus: { OK: 200 },
        logger: {
            error: jest.fn(),
            info: jest.fn(),
        },
    };
});

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('../../utils/sumsub', () => ({
    mapSumsubReviewToVerificationStatus: jest.fn().mockReturnValue('approved'),
    verifySumsubWebhookSignature: jest.fn(),
}));

import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { HandleSumsubWebhook } from './index';
import { verifySumsubWebhookSignature } from '../../utils/sumsub';

describe('HandleSumsubWebhook service', () => {
    it('updates the verification status and syncs the user verification flag', async () => {
        const identityVerificationRepository = {
            getByProviderApplicantId: jest.fn().mockResolvedValue({
                id: 'verification-1',
                userId: 'user-1',
                providerApplicantId: 'sumsub-applicant-1',
                providerPayload: {},
                providerLevelName: 'gigify-basic-kyc',
                status: 'pending',
            }),
            getLatestByUserIdAndProvider: jest.fn(),
            updateVerification: jest.fn().mockResolvedValue({
                id: 'verification-1',
                userId: 'user-1',
                status: 'approved',
            }),
            createProviderVerification: jest.fn(),
        };
        const userRepository = {
            updateById: jest.fn().mockResolvedValue(undefined),
        };

        const service = new HandleSumsubWebhook(identityVerificationRepository as never, userRepository as never);

        const response = await service.handle({
            headers: {
                'x-payload-digest': 'digest',
                'x-payload-digest-alg': 'HMAC_SHA256_HEX',
            },
            request: {
                rawBody: '{"type":"applicantReviewed"}',
                body: {
                    type: 'applicantReviewed',
                    applicantId: 'sumsub-applicant-1',
                    reviewStatus: 'completed',
                    reviewResult: {
                        reviewAnswer: 'GREEN',
                    },
                },
            },
        } as never);

        expect(verifySumsubWebhookSignature).toHaveBeenCalled();
        expect(identityVerificationRepository.updateVerification).toHaveBeenCalledWith(
            'verification-1',
            expect.objectContaining({
                status: 'approved',
            }),
        );
        expect(userRepository.updateById).toHaveBeenCalledWith('user-1', {
            isVerified: true,
        });
        expect(notificationDispatcher.dispatch).toHaveBeenCalled();
        expect(response.data.handled).toBe(true);
    });
});
