import { BadRequestError, ControllerArgs, HttpStatus, logger } from '@/core';
import { Json } from '@/core/types';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { IdentityVerificationRepository, UserRepository } from '../../repository';
import { mapSumsubReviewToVerificationStatus, verifySumsubWebhookSignature } from '../../utils/sumsub';

type SumsubWebhookPayload = Record<string, any>;

const mergeProviderPayload = (current: unknown, next: Record<string, unknown>) => {
    const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};

    return {
        ...(base as Record<string, unknown>),
        ...next,
    } as Json;
};

export class HandleSumsubWebhook {
    constructor(private readonly identityVerificationRepository: IdentityVerificationRepository, private readonly userRepository: UserRepository) {}

    handle = async ({ headers, request }: ControllerArgs) => {
        if (!request.rawBody) {
            throw new BadRequestError('Missing raw Sumsub webhook payload.');
        }

        verifySumsubWebhookSignature({
            rawBody: request.rawBody,
            digestHeader: headers['x-payload-digest'],
            digestAlgHeader: headers['x-payload-digest-alg'],
        });

        const event = request.body as SumsubWebhookPayload;
        const applicantId = event.applicantId ?? event.applicant?.id ?? null;
        const externalUserId = event.externalUserId ?? event.externalUser?.id ?? event.applicant?.externalUserId ?? null;
        const reviewStatus = event.reviewStatus ?? event.status ?? event.type ?? null;
        const reviewAnswer = event.reviewResult?.reviewAnswer ?? null;
        const mappedStatus = mapSumsubReviewToVerificationStatus({
            reviewStatus,
            reviewAnswer,
        });
        const notes =
            event.reviewResult?.moderationComment ??
            event.reviewResult?.clientComment ??
            (Array.isArray(event.reviewResult?.rejectLabels) ? event.reviewResult.rejectLabels.join(', ') : null) ??
            null;

        let verification = applicantId ? await this.identityVerificationRepository.getByProviderApplicantId(applicantId) : null;

        if (!verification && externalUserId) {
            verification = await this.identityVerificationRepository.getLatestByUserIdAndProvider(externalUserId, 'sumsub');
        }

        if (!verification && !externalUserId) {
            return {
                code: HttpStatus.OK,
                message: 'Sumsub Webhook Processed Successfully',
                data: {
                    acknowledged: true,
                    handled: false,
                    eventType: event.type ?? null,
                },
            };
        }

        const updatedVerification = verification
            ? await this.identityVerificationRepository.updateVerification(verification.id, {
                  status: mappedStatus,
                  notes,
                  reviewedAt: mappedStatus === 'pending' ? null : new Date().toISOString(),
                  provider: 'sumsub',
                  providerApplicantId: applicantId ?? verification.providerApplicantId ?? null,
                  providerLevelName: event.levelName ?? verification.providerLevelName ?? null,
                  providerReviewStatus: reviewStatus,
                  providerReviewResult: reviewAnswer,
                  providerPayload: mergeProviderPayload(verification.providerPayload, event),
              })
            : await this.identityVerificationRepository.createProviderVerification({
                  userId: externalUserId!,
                  provider: 'sumsub',
                  status: mappedStatus,
                  notes,
                  reviewedAt: mappedStatus === 'pending' ? null : new Date().toISOString(),
                  providerApplicantId: applicantId ?? null,
                  providerLevelName: event.levelName ?? null,
                  providerReviewStatus: reviewStatus,
                  providerReviewResult: reviewAnswer,
                  providerPayload: event,
              });

        await this.userRepository.updateById(updatedVerification.userId, {
            isVerified: updatedVerification.status === 'approved',
        });

        if (!verification || verification.status !== updatedVerification.status) {
            await notificationDispatcher.dispatch({
                userId: updatedVerification.userId,
                type: 'security_alert',
                title: 'Identity verification updated',
                message:
                    updatedVerification.status === 'approved'
                        ? 'Your identity verification has been approved.'
                        : updatedVerification.status === 'rejected'
                        ? 'Your identity verification was rejected. Please review the feedback and try again.'
                        : 'Your identity verification is pending review.',
                payload: {
                    verificationId: updatedVerification.id,
                    status: updatedVerification.status,
                },
                preferenceKey: 'securityAlerts',
            });
        }

        logger.info('Sumsub webhook processed', {
            eventType: event.type ?? null,
            verificationId: updatedVerification.id,
            status: updatedVerification.status,
        });

        return {
            code: HttpStatus.OK,
            message: 'Sumsub Webhook Processed Successfully',
            data: {
                acknowledged: true,
                handled: true,
                eventType: event.type ?? null,
                verificationId: updatedVerification.id,
                status: updatedVerification.status,
            },
        };
    };
}

const handleSumsubWebhook = new HandleSumsubWebhook(new IdentityVerificationRepository(), new UserRepository());

export default handleSumsubWebhook;
