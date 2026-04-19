jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}
    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    TalentRepository: class TalentRepository {},
    SavedTalentRepository: class SavedTalentRepository {},
}));

import { BadRequestError, RouteNotFoundError } from '@/core';
import { SaveTalent } from './index';
import { RemoveSavedTalent } from '../removeSavedTalent';
import { GetSavedTalents } from '../getSavedTalents';

describe('Saved talents services', () => {
    it('saves a talent when it exists and the caller is not the talent', async () => {
        const talentRepository = { findByUserId: jest.fn().mockResolvedValue({ id: 't-profile-1' }) };
        const savedTalentRepository = { saveTalent: jest.fn().mockResolvedValue({ id: 'saved-1' }) };
        const service = new SaveTalent(talentRepository as never, savedTalentRepository as never);

        const response = await service.handle({
            params: { id: 'talent-1' },
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(savedTalentRepository.saveTalent).toHaveBeenCalledWith('employer-1', 'talent-1');
        expect(response.data).toEqual({ id: 'saved-1' });
    });

    it('refuses to save yourself', async () => {
        const service = new SaveTalent({ findByUserId: jest.fn() } as never, { saveTalent: jest.fn() } as never);
        await expect(service.handle({ params: { id: 'user-1' }, request: { user: { id: 'user-1' } } } as never)).rejects.toBeInstanceOf(
            BadRequestError,
        );
    });

    it('404s when the talent profile does not exist', async () => {
        const service = new SaveTalent({ findByUserId: jest.fn().mockResolvedValue(null) } as never, { saveTalent: jest.fn() } as never);
        await expect(service.handle({ params: { id: 'ghost' }, request: { user: { id: 'employer-1' } } } as never)).rejects.toBeInstanceOf(
            RouteNotFoundError,
        );
    });

    it('removes a saved talent', async () => {
        const savedTalentRepository = { removeTalent: jest.fn().mockResolvedValue(undefined) };
        const service = new RemoveSavedTalent(savedTalentRepository as never);

        await service.handle({
            params: { id: 'talent-1' },
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(savedTalentRepository.removeTalent).toHaveBeenCalledWith('employer-1', 'talent-1');
    });

    it('lists saved talents for the caller', async () => {
        const savedTalentRepository = { getSavedTalentsForUser: jest.fn().mockResolvedValue([{ id: 'saved-1' }]) };
        const service = new GetSavedTalents(savedTalentRepository as never);

        const response = await service.handle({
            query: { page: 1 },
            request: { user: { id: 'employer-1' } },
        } as never);

        expect(savedTalentRepository.getSavedTalentsForUser).toHaveBeenCalledWith('employer-1', { page: 1 });
        expect(response.data).toHaveLength(1);
    });
});
