jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
}));

jest.mock('../../repository', () => ({
    AdminRepository: class AdminRepository {},
}));

import { GetAdminAuditLogs } from './index';

describe('GetAdminAuditLogs service', () => {
    it('retrieves audit logs with query filters', async () => {
        const adminRepository = {
            getAuditLogs: jest.fn().mockResolvedValue([
                { id: 'log-1', action: 'user_created', userId: 'admin-1', createdAt: '2024-01-01T00:00:00Z' },
                { id: 'log-2', action: 'gig_updated', userId: 'admin-1', createdAt: '2024-01-02T00:00:00Z' },
            ]),
        };

        const service = new GetAdminAuditLogs(adminRepository as never);

        const response = await service.handle({
            query: { action: 'user_created', limit: 100 },
        } as never);

        expect(adminRepository.getAuditLogs).toHaveBeenCalledWith({ action: 'user_created', limit: 100 });
        expect(response.message).toBe('Audit Logs Retrieved Successfully');
        expect(response.data).toHaveLength(2);
    });

    it('handles empty query', async () => {
        const adminRepository = {
            getAuditLogs: jest.fn().mockResolvedValue([]),
        };

        const service = new GetAdminAuditLogs(adminRepository as never);

        await service.handle({
            query: undefined,
        } as never);

        expect(adminRepository.getAuditLogs).toHaveBeenCalledWith({});
    });

    it('returns empty list when no logs exist', async () => {
        const adminRepository = {
            getAuditLogs: jest.fn().mockResolvedValue([]),
        };

        const service = new GetAdminAuditLogs(adminRepository as never);

        const response = await service.handle({
            query: {},
        } as never);

        expect(response.data).toEqual([]);
    });
});
