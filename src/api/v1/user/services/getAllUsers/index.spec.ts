jest.mock('@/core', () => {
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
    };
});

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

import { GetAllUsers } from './index';

describe('GetAllUsers service', () => {
    it('retrieves all users with query filters', async () => {
        const userRepository = {
            getAllUsers: jest.fn().mockResolvedValue([
                { id: 'user-1', email: 'user1@example.com', role: 'talent' },
                { id: 'user-2', email: 'user2@example.com', role: 'employer' },
            ]),
        };

        const service = new GetAllUsers(userRepository as never);

        const response = await service.handle({
            query: { limit: 20, role: 'talent' },
        } as never);

        expect(userRepository.getAllUsers).toHaveBeenCalledWith({ limit: 20, role: 'talent' });
        expect(response.message).toBe('Users Fetched Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('throws when no users found', async () => {
        const userRepository = {
            getAllUsers: jest.fn().mockResolvedValue(null),
        };

        const service = new GetAllUsers(userRepository as never);

        await expect(
            service.handle({
                query: {},
            } as never),
        ).rejects.toThrow('Invalid user ID');
    });

    it('handles empty query', async () => {
        const userRepository = {
            getAllUsers: jest.fn().mockResolvedValue([]),
        };

        const service = new GetAllUsers(userRepository as never);

        const response = await service.handle({
            query: undefined,
        } as never);

        expect(response.data).toEqual([]);
    });
});
