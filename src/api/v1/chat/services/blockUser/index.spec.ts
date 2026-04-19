jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class UnAuthorizedError extends Error {}
    return {
        BadRequestError,
        HttpStatus: { CREATED: 201, OK: 200 },
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    ModerationRepository: class ModerationRepository {},
}));

import { BadRequestError } from '@/core';
import { BlockUser } from './index';
import { UnblockUser } from '../unblockUser';
import { ListMyBlocks } from '../listMyBlocks';

describe('Block / Unblock / List blocks services', () => {
    it('blocks a user', async () => {
        const moderationRepository = {
            createBlock: jest.fn().mockResolvedValue({ blockerId: 'a', blockedId: 'b', reason: null, createdAt: 'now' }),
        };
        const service = new BlockUser(moderationRepository as never);

        const response = await service.handle({
            input: { userId: 'b', reason: 'harassment' },
            request: { user: { id: 'a' } },
        } as never);

        expect(moderationRepository.createBlock).toHaveBeenCalledWith({
            blockerId: 'a',
            blockedId: 'b',
            reason: 'harassment',
        });
        expect(response.code).toBe(201);
    });

    it('rejects blocking yourself', async () => {
        const moderationRepository = {
            createBlock: jest.fn(),
        };
        const service = new BlockUser(moderationRepository as never);

        await expect(
            service.handle({
                input: { userId: 'a' },
                request: { user: { id: 'a' } },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestError);

        expect(moderationRepository.createBlock).not.toHaveBeenCalled();
    });

    it('unblocks a user', async () => {
        const moderationRepository = {
            removeBlock: jest.fn().mockResolvedValue(undefined),
        };
        const service = new UnblockUser(moderationRepository as never);

        await service.handle({
            params: { userId: 'b' },
            request: { user: { id: 'a' } },
        } as never);

        expect(moderationRepository.removeBlock).toHaveBeenCalledWith('a', 'b');
    });

    it("lists the current user's blocks", async () => {
        const moderationRepository = {
            listBlocks: jest.fn().mockResolvedValue([{ blockerId: 'a', blockedId: 'b' }]),
        };
        const service = new ListMyBlocks(moderationRepository as never);

        const response = await service.handle({
            request: { user: { id: 'a' } },
        } as never);

        expect(moderationRepository.listBlocks).toHaveBeenCalledWith('a');
        expect(response.data).toHaveLength(1);
    });
});
