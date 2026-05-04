jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('../../repository', () => ({
    TalentRepository: class TalentRepository {},
}));

import { BrowseTalents } from './index';

describe('BrowseTalents service', () => {
    it('delegates the full query object to the repository', async () => {
        const talentRepository = {
            findForBrowse: jest.fn().mockResolvedValue([{ userId: 't-1', stageName: 'DJ Kola', averageRating: 4.8, reviewCount: 10 }]),
        };

        const service = new BrowseTalents(talentRepository as never);

        const response = await service.handle({
            query: {
                page: 1,
                pageSize: 20,
                search: 'Kola',
                minRating: 4,
                sortBy: 'rating',
            },
        } as never);

        expect(talentRepository.findForBrowse).toHaveBeenCalledWith(expect.objectContaining({ search: 'Kola', minRating: 4, sortBy: 'rating' }));
        expect(response.data).toHaveLength(1);
    });
});
