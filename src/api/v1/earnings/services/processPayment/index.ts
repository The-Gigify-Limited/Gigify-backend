import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { EmployerRepository } from '~/employers/repository';
import { ProcessPaymentDto } from '~/earnings/interfaces';
import { EarningsRepository } from '~/earnings/repository';
import { ActivityRepository } from '~/user/repository';

export class ProcessPayment {
    constructor(
        private readonly earningsRepository: EarningsRepository,
        private readonly employerRepository: EmployerRepository,
        private readonly activityRepository: ActivityRepository,
    ) {}

    handle = async ({ input, request }: ControllerArgs<ProcessPaymentDto>) => {
        const employerId = request.user?.id;

        if (!employerId) throw new UnAuthorizedError('User not authenticated');
        if (!input?.talentId) throw new BadRequestError('Talent ID is required');
        if (!input.amount || input.amount <= 0) throw new BadRequestError('Payment amount must be greater than zero');

        const existingPayment = input.paymentId
            ? await this.earningsRepository.getPaymentById(input.paymentId)
            : await this.earningsRepository.findPendingPaymentByContext({
                  applicationId: input.applicationId,
                  gigId: input.gigId,
                  talentId: input.talentId,
              });

        if (existingPayment && existingPayment.employerId !== employerId) {
            throw new ConflictError('You do not own this payment');
        }

        const payment =
            existingPayment && existingPayment.id
                ? await this.earningsRepository.updatePayment(existingPayment.id, {
                      amount: input.amount,
                      currency: input.currency ?? existingPayment.currency,
                      paymentReference: input.paymentReference ?? existingPayment.paymentReference,
                      platformFee: input.platformFee ?? existingPayment.platformFee,
                      provider: input.provider ?? existingPayment.provider,
                      status: input.status ?? 'paid',
                      paidAt: input.status === 'failed' || input.status === 'cancelled' ? null : new Date().toISOString(),
                  })
                : await this.earningsRepository.createPayment({
                      employerId,
                      talentId: input.talentId,
                      amount: input.amount,
                      applicationId: input.applicationId,
                      currency: input.currency,
                      gigId: input.gigId,
                      paymentReference: input.paymentReference,
                      platformFee: input.platformFee,
                      provider: input.provider,
                      status: input.status ?? 'paid',
                      paidAt: input.status === 'failed' || input.status === 'cancelled' ? null : new Date().toISOString(),
                  });

        if (payment.status === 'paid') {
            await Promise.all([
                this.employerRepository.syncStats(employerId),
                this.activityRepository.logActivity(input.talentId, 'payment_received', payment.id, {
                    amount: payment.amount,
                    gigId: payment.gigId,
                }),
            ]);
        }

        return {
            code: HttpStatus.OK,
            message: 'Payment Processed Successfully',
            data: payment,
        };
    };
}

const processPayment = new ProcessPayment(new EarningsRepository(), new EmployerRepository(), new ActivityRepository());

export default processPayment;
