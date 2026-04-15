jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ForbiddenError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BadRequestError,
        ForbiddenError,
        HttpStatus: { NO_CONTENT: 204 },
        UnAuthorizedError,
    };
});

jest.mock('~/talents/repository', () => ({
    TalentPortfolioRepository: class TalentPortfolioRepository {},
    TalentRepository: class TalentRepository {},
}));

import { DeleteTalentPortfolio } from './index';

describe('DeleteTalentPortfolio service', () => {
    it('deletes a portfolio item for authorized talent', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-1',
                userId: 'user-1',
            }),
        };
        const talentPortfolioRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'port-1',
                talent_id: 'talent-1',
                imageUrl: 'image.jpg',
            }),
            deleteTalentPortfolio: jest.fn().mockResolvedValue(undefined),
        };

        const service = new DeleteTalentPortfolio(talentPortfolioRepository as never, talentRepository as never);

        const response = await service.handle({
            params: { talentPortfolioId: 'port-1' },
            request: {
                user: { id: 'user-1' },
            },
        } as never);

        expect(talentRepository.findByUserId).toHaveBeenCalledWith('user-1');
        expect(talentPortfolioRepository.findById).toHaveBeenCalledWith('port-1');
        expect(talentPortfolioRepository.deleteTalentPortfolio).toHaveBeenCalledWith('port-1');
        expect(response.message).toBe('Talent Portfolio Deleted Successfully');
    });

    it('throws when params are invalid', async () => {
        const talentRepository = {
            findByUserId: jest.fn(),
        };
        const talentPortfolioRepository = {
            findById: jest.fn(),
            deleteTalentPortfolio: jest.fn(),
        };

        const service = new DeleteTalentPortfolio(talentPortfolioRepository as never, talentRepository as never);

        await expect(
            service.handle({
                params: undefined,
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow('Invalid Talent Portfolio ID');

        expect(talentRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('throws when user is not authenticated', async () => {
        const talentRepository = {
            findByUserId: jest.fn(),
        };
        const talentPortfolioRepository = {
            findById: jest.fn(),
            deleteTalentPortfolio: jest.fn(),
        };

        const service = new DeleteTalentPortfolio(talentPortfolioRepository as never, talentRepository as never);

        await expect(
            service.handle({
                params: { talentPortfolioId: 'port-1' },
                request: { user: undefined },
            } as never),
        ).rejects.toThrow('User not authenticated');

        expect(talentRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('throws when portfolio not found', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-1',
            }),
        };
        const talentPortfolioRepository = {
            findById: jest.fn().mockResolvedValue(null),
            deleteTalentPortfolio: jest.fn(),
        };

        const service = new DeleteTalentPortfolio(talentPortfolioRepository as never, talentRepository as never);

        await expect(
            service.handle({
                params: { talentPortfolioId: 'port-1' },
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow('Talent Portfolio not Found!');

        expect(talentPortfolioRepository.deleteTalentPortfolio).not.toHaveBeenCalled();
    });

    it('throws when talent is not registered', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue(null),
        };
        const talentPortfolioRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'port-1',
                talent_id: 'talent-1',
            }),
            deleteTalentPortfolio: jest.fn(),
        };

        const service = new DeleteTalentPortfolio(talentPortfolioRepository as never, talentRepository as never);

        await expect(
            service.handle({
                params: { talentPortfolioId: 'port-1' },
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow("Talent not found! You're not registered as a talent.");

        expect(talentPortfolioRepository.deleteTalentPortfolio).not.toHaveBeenCalled();
    });

    it('throws when user does not own the portfolio', async () => {
        const talentRepository = {
            findByUserId: jest.fn().mockResolvedValue({
                id: 'talent-1',
            }),
        };
        const talentPortfolioRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'port-1',
                talent_id: 'different-talent',
            }),
            deleteTalentPortfolio: jest.fn(),
        };

        const service = new DeleteTalentPortfolio(talentPortfolioRepository as never, talentRepository as never);

        await expect(
            service.handle({
                params: { talentPortfolioId: 'port-1' },
                request: {
                    user: { id: 'user-1' },
                },
            } as never),
        ).rejects.toThrow('You do not have access to this portfolio item');

        expect(talentPortfolioRepository.deleteTalentPortfolio).not.toHaveBeenCalled();
    });
});
