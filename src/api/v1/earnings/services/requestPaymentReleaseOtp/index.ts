import { ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, TooManyRequestsError, UnAuthorizedError, auditService } from '@/core';
import { paymentReleaseOtpMail } from '@/core/services/mails/views';
import { sendEmail } from '@/core/services/mails';
import { PaymentReleaseParamsDto } from '../../interfaces';
import { EarningsRepository } from '../../repository';
import {
    buildPaymentReleaseOtpExpiry,
    generatePaymentReleaseOtpCode,
    getPaymentReleaseOtpCooldownRemaining,
    hashPaymentReleaseOtpCode,
} from '../../utils/paymentReleaseOtp';
import { GigRepository } from '~/gigs/repository';
import { UserRepository } from '~/user/repository';

export class RequestPaymentReleaseOtp {
    constructor(
        private readonly earningsRepository: EarningsRepository,
        private readonly gigRepository: GigRepository,
        private readonly userRepository: UserRepository,
    ) {}

    handle = async ({ params, request }: ControllerArgs<PaymentReleaseParamsDto>) => {
        const employer = request.user;

        if (!employer?.id) throw new UnAuthorizedError('User not authenticated');

        const payment = await this.earningsRepository.getPaymentById(params.id);

        if (!payment) throw new RouteNotFoundError('Payment not found');
        if (payment.employerId !== employer.id) throw new ConflictError('You do not own this payment');
        if (payment.status === 'paid') throw new ConflictError('This payment has already been released');
        if (payment.status === 'cancelled' || payment.status === 'refunded' || payment.status === 'failed') {
            throw new ConflictError('This payment cannot be released');
        }

        const userRow = await this.userRepository.findById(employer.id);

        if (!userRow) throw new RouteNotFoundError('Employer profile not found');

        const user = this.userRepository.mapToCamelCase(userRow);

        const existingOtp = await this.earningsRepository.getActivePaymentReleaseOtp(payment.id, employer.id);
        const gig = payment.gigId ? await this.gigRepository.getGigById(payment.gigId) : null;

        if (existingOtp) {
            const cooldownRemaining = getPaymentReleaseOtpCooldownRemaining(existingOtp.lastSentAt);

            if (cooldownRemaining > 0) {
                throw new TooManyRequestsError(`Please wait ${cooldownRemaining} seconds before requesting another code.`);
            }
        }

        const otpCode = generatePaymentReleaseOtpCode();
        const otpHash = hashPaymentReleaseOtpCode(otpCode);
        const expiresAt = buildPaymentReleaseOtpExpiry();
        const otpRecord = existingOtp
            ? await this.earningsRepository.updatePaymentReleaseOtp(existingOtp.id, {
                  codeHash: otpHash,
                  expiresAt,
                  attempts: 0,
                  consumedAt: null,
                  lastSentAt: new Date().toISOString(),
              })
            : await this.earningsRepository.createPaymentReleaseOtp({
                  paymentId: payment.id,
                  employerId: employer.id,
                  codeHash: otpHash,
                  expiresAt,
              });

        if (user.email) {
            await sendEmail({
                to: user.email,
                subject: 'Gigify payment release verification code',
                body: paymentReleaseOtpMail({
                    firstName: user.firstName ?? 'there',
                    otpCode,
                    gigTitle: gig?.title ?? 'your booking',
                    amount: `${payment.currency} ${payment.amount}`,
                }),
            });
        }

        await auditService.log({
            userId: employer.id,
            action: 'payment_release_otp_requested',
            resourceType: 'payment',
            resourceId: payment.id,
            changes: {
                otpId: otpRecord.id,
            },
            ipAddress: request.ip ?? null,
            userAgent: Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] ?? null : request.headers['user-agent'] ?? null,
        });

        return {
            code: HttpStatus.OK,
            message: 'Payment Release Verification Code Sent Successfully',
            data: {
                expiresAt,
                resendAvailableInSeconds: 90,
            },
        };
    };
}

const requestPaymentReleaseOtp = new RequestPaymentReleaseOtp(new EarningsRepository(), new GigRepository(), new UserRepository());
export default requestPaymentReleaseOtp;
