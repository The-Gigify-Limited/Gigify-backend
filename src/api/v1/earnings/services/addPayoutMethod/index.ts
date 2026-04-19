import { BadRequestError, ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { PayoutMethodRepository } from '~/earnings/repository';
import { PayoutMethodProviderEnum } from '~/earnings/interfaces';

type AddPayoutMethodArgs = ControllerArgs<{
    input: {
        provider: PayoutMethodProviderEnum;
        externalAccountId?: string;
        displayLabel?: string;
        metadata?: Record<string, unknown>;
    };
}>;

export class AddPayoutMethod {
    constructor(private readonly payoutMethodRepository: PayoutMethodRepository) {}

    handle = async ({ input, request }: AddPayoutMethodArgs) => {
        const userId = request.user?.id;
        if (!userId) throw new UnAuthorizedError('User not authenticated');

        if (input.provider === 'bank' || input.provider === 'paypal') {
            if (!input.externalAccountId || !input.externalAccountId.trim()) {
                throw new BadRequestError('An account identifier (bank last4 or PayPal email) is required for this provider');
            }
        }

        // Stripe Connect onboarding UX is deferred to a Phase 5 follow-up;
        // this endpoint just stores the account id if the frontend already
        // has one (e.g. from an out-of-band Stripe Connect link).
        const method = await this.payoutMethodRepository.create({
            userId,
            provider: input.provider,
            externalAccountId: input.externalAccountId ?? null,
            displayLabel: input.displayLabel ?? null,
            metadata: input.metadata ?? null,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'Payout Method Added Successfully',
            data: method,
        };
    };
}

const addPayoutMethod = new AddPayoutMethod(new PayoutMethodRepository());

export default addPayoutMethod;
