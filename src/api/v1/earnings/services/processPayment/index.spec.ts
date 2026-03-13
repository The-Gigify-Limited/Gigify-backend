jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('~/earnings/repository', () => ({
    EarningsRepository: class EarningsRepository {},
}));

jest.mock('~/employers/repository', () => ({
    EmployerRepository: class EmployerRepository {},
}));

jest.mock('~/user/repository', () => ({
    ActivityRepository: class ActivityRepository {},
}));

import { ProcessPayment } from './index';

describe('ProcessPayment service', () => {
    it('settles an existing pending payment and logs the payment_received activity', async () => {
        const earningsRepository = {
            getPaymentById: jest.fn().mockResolvedValue({
                id: 'payment-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                currency: 'NGN',
                platformFee: 5000,
                provider: 'manual',
                paymentReference: 'ref-123',
                status: 'pending',
            }),
            updatePayment: jest.fn().mockResolvedValue({
                id: 'payment-1',
                employerId: 'employer-1',
                talentId: 'talent-1',
                gigId: 'gig-1',
                amount: 100000,
                platformFee: 5000,
                status: 'paid',
            }),
        };
        const employerRepository = {
            syncStats: jest.fn().mockResolvedValue(undefined),
        };
        const activityRepository = {
            logActivity: jest.fn().mockResolvedValue(undefined),
        };

        const service = new ProcessPayment(earningsRepository as never, employerRepository as never, activityRepository as never);

        const response = await service.handle({
            input: {
                paymentId: 'payment-1',
                talentId: 'talent-1',
                amount: 100000,
            },
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(earningsRepository.updatePayment).toHaveBeenCalledWith(
            'payment-1',
            expect.objectContaining({
                amount: 100000,
                status: 'paid',
            }),
        );
        expect(employerRepository.syncStats).toHaveBeenCalledWith('employer-1');
        expect(activityRepository.logActivity).toHaveBeenCalledWith('talent-1', 'payment_received', 'payment-1', {
            amount: 100000,
            gigId: 'gig-1',
        });
        expect(response.message).toBe('Payment Processed Successfully');
    });
});
