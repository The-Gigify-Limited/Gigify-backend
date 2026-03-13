import { ControllerArgs, HttpStatus, UnAuthorizedError, logger } from '@/core';
import { Json } from '@/core/types';
import { IdentityVerificationRepository, UserRepository } from '../../repository';
import { getSumsubApplicantReviewStatus, mapSumsubReviewToVerificationStatus } from '../../utils/sumsub';

const mergeProviderPayload = (current: unknown, next: Record<string, unknown>) => {
    const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};

    return {
        ...(base as Record<string, unknown>),
        ...next,
    } as Json;
};

export class GetKycStatus {
    constructor(private readonly identityVerificationRepository: IdentityVerificationRepository, private readonly userRepository: UserRepository) {}

    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const userRow = await this.userRepository.findById(userId);
        const user = userRow ? this.userRepository.mapToCamelCase(userRow) : null;

        let verification =
            (await this.identityVerificationRepository.getLatestByUserIdAndProvider(userId, 'sumsub')) ||
            (await this.identityVerificationRepository.getLatestByUserId(userId));

        if (verification?.provider === 'sumsub' && verification.providerApplicantId) {
            try {
                const remoteStatus = await getSumsubApplicantReviewStatus(verification.providerApplicantId);
                const reviewStatus = remoteStatus.reviewStatus ?? remoteStatus.status ?? null;
                const reviewAnswer = remoteStatus.reviewResult?.reviewAnswer ?? null;
                const mappedStatus = mapSumsubReviewToVerificationStatus({
                    reviewStatus,
                    reviewAnswer,
                });

                verification = await this.identityVerificationRepository.updateVerification(verification.id, {
                    status: mappedStatus,
                    reviewedAt: mappedStatus === 'pending' ? null : new Date().toISOString(),
                    providerReviewStatus: reviewStatus,
                    providerReviewResult: reviewAnswer,
                    providerPayload: mergeProviderPayload(verification.providerPayload, {
                        lastStatusSync: new Date().toISOString(),
                        statusSnapshot: remoteStatus,
                    }),
                });

                if (user) {
                    await this.userRepository.updateById(userId, {
                        isVerified: verification.status === 'approved',
                    });
                }
            } catch (error: any) {
                logger.error('Failed to sync Sumsub KYC status', {
                    userId,
                    verificationId: verification.id,
                    providerApplicantId: verification.providerApplicantId,
                    error: error?.message,
                    status: error?.response?.status,
                });
            }
        }

        return {
            code: HttpStatus.OK,
            message: 'KYC Status Retrieved Successfully',
            data: {
                verification,
                isVerified: verification?.status === 'approved' || Boolean(user?.isVerified),
                completed: verification?.status === 'approved',
            },
        };
    };
}

const getKycStatus = new GetKycStatus(new IdentityVerificationRepository(), new UserRepository());

export default getKycStatus;
