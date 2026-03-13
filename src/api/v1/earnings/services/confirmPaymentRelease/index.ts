import {
    BadRequestError,
    ConflictError,
    ControllerArgs,
    HttpStatus,
    RouteNotFoundError,
    TooManyRequestsError,
    UnAuthorizedError,
    auditService,
} from '@/core';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { ActivityRepository } from '~/user/repository';
import { ConfirmPaymentReleaseDto } from '../../interfaces';
import { EarningsRepository } from '../../repository';
import { hashPaymentReleaseOtpCode, PAYMENT_RELEASE_OTP_MAX_ATTEMPTS } from '../../utils/paymentReleaseOtp';
import { GigRepository } from '~/gigs/repository';
import { EmployerRepository } from '~/employers/repository';

export class ConfirmPaymentRelease {
    constructor(
        private readonly earningsRepository: EarningsRepository,
        private readonly gigRepository: GigRepository,
        private readonly employerRepository: EmployerRepository,
        private readonly activityRepository: ActivityRepository,
    ) {}

    handle = async ({ params, input, request }: ControllerArgs<ConfirmPaymentReleaseDto>) => {
        const employer = request.user;

        if (!employer?.id) throw new UnAuthorizedError('User not authenticated');

        const payment = await this.earningsRepository.getPaymentById(params.id);

        if (!payment) throw new RouteNotFoundError('Payment not found');
        if (payment.employerId !== employer.id) throw new ConflictError('You do not own this payment');
        if (payment.status === 'paid') throw new ConflictError('This payment has already been released');

        const otpRecord = await this.earningsRepository.getActivePaymentReleaseOtp(payment.id, employer.id);

        if (!otpRecord) throw new BadRequestError('No active verification code was found for this payment');
        if (otpRecord.consumedAt) throw new ConflictError('This verification code has already been used');
        if (new Date(otpRecord.expiresAt).getTime() < Date.now()) throw new ConflictError('This verification code has expired');
        if (otpRecord.attempts >= PAYMENT_RELEASE_OTP_MAX_ATTEMPTS) {
            throw new TooManyRequestsError('Too many incorrect verification attempts. Request a new code to continue.');
        }

        const incomingHash = hashPaymentReleaseOtpCode(input.otpCode);

        if (incomingHash !== otpRecord.codeHash) {
            await this.earningsRepository.updatePaymentReleaseOtp(otpRecord.id, {
                attempts: otpRecord.attempts + 1,
            });

            await auditService.log({
                userId: employer.id,
                action: 'payment_release_otp_failed',
                resourceType: 'payment',
                resourceId: payment.id,
                result: 'failure',
                changes: {
                    otpId: otpRecord.id,
                    attempts: otpRecord.attempts + 1,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] ?? null : request.headers['user-agent'] ?? null,
                errorMessage: 'Invalid payment release OTP',
            });

            throw new BadRequestError('Invalid verification code');
        }

        const paidAt = new Date().toISOString();

        const [updatedPayment] = await Promise.all([
            this.earningsRepository.updatePayment(payment.id, {
                status: 'paid',
                paidAt,
            }),
            this.earningsRepository.updatePaymentReleaseOtp(otpRecord.id, {
                consumedAt: paidAt,
            }),
        ]);

        await Promise.all([
            this.employerRepository.syncStats(employer.id),
            this.activityRepository.logActivity(payment.talentId, 'payment_received', payment.id, {
                amount: updatedPayment.amount,
                gigId: updatedPayment.gigId,
            }),
            notificationDispatcher.dispatch({
                userId: payment.talentId,
                type: 'payment_update',
                title: 'Payment released',
                message: 'Your employer released your escrow payment.',
                payload: {
                    paymentId: payment.id,
                    gigId: payment.gigId,
                    amount: updatedPayment.amount,
                    currency: updatedPayment.currency,
                },
                preferenceKey: 'paymentUpdates',
            }),
            auditService.log({
                userId: employer.id,
                action: 'payment_release_confirmed',
                resourceType: 'payment',
                resourceId: payment.id,
                changes: {
                    otpId: otpRecord.id,
                    paidAt,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] ?? null : request.headers['user-agent'] ?? null,
            }),
        ]);

        if (payment.gigId) {
            const [gig, paymentsForGig] = await Promise.all([
                this.gigRepository.getGigById(payment.gigId),
                this.earningsRepository.getPaymentsForGig(payment.gigId),
            ]);

            if (gig) {
                const requiredTalentCount = Math.max(gig.requiredTalentCount ?? 1, 1);
                const allPaymentsReleased =
                    paymentsForGig.length >= requiredTalentCount && paymentsForGig.every((existingPayment) => existingPayment.status === 'paid');

                if (allPaymentsReleased && gig.status !== 'completed') {
                    await this.gigRepository.updateGigById(gig.id, {
                        status: 'completed',
                    });

                    await Promise.all([
                        this.activityRepository.logActivity(employer.id, 'gig_completed', gig.id, {
                            paymentId: payment.id,
                        }),
                        this.activityRepository.logActivity(payment.talentId, 'gig_completed', gig.id, {
                            paymentId: payment.id,
                        }),
                    ]);
                }
            }
        }

        return {
            code: HttpStatus.OK,
            message: 'Payment Released Successfully',
            data: updatedPayment,
        };
    };
}

const confirmPaymentRelease = new ConfirmPaymentRelease(new EarningsRepository(), new GigRepository(), new EmployerRepository(), new ActivityRepository());
export default confirmPaymentRelease;
