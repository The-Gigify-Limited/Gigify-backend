jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('../../repository', () => ({
    AdminRepository: class AdminRepository {},
}));

import { GetAdminUsers } from './index';

describe('GetAdminUsers service', () => {
    it('retrieves users with query parameters', async () => {
        const adminRepository = {
            getUsers: jest.fn().mockResolvedValue([
                { id: 'user-1', email: 'user1@example.com', role: 'talent', status: 'active' },
                { id: 'user-2', email: 'user2@example.com', role: 'employer', status: 'active' },
            ]),
        };

        const service = new GetAdminUsers(adminRepository as never);

        const response = await service.handle({
            query: { limit: 20, status: 'active' },
        } as never);

        expect(adminRepository.getUsers).toHaveBeenCalledWith({ limit: 20, status: 'active' });
        expect(response.message).toBe('Admin Users Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('handles empty query', async () => {
        const adminRepository = {
            getUsers: jest.fn().mockResolvedValue([]),
        };

        const service = new GetAdminUsers(adminRepository as never);

        await service.handle({
            query: undefined,
        } as never);

        expect(adminRepository.getUsers).toHaveBeenCalledWith({});
    });

    it('returns empty list when no users exist', async () => {
        const adminRepository = {
            getUsers: jest.fn().mockResolvedValue([]),
        };

        const service = new GetAdminUsers(adminRepository as never);

        const response = await service.handle({
            query: {},
        } as never);

        expect(response.data).toEqual([]);
    });
});
