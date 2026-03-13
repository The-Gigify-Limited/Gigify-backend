jest.mock('@/core', () => {
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        ConflictError,
        HttpStatus: { CREATED: 201 },
        RouteNotFoundError,
        UnAuthorizedError,
        auditService: {
            log: jest.fn(),
        },
    };
});

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: jest.fn(),
    },
}));

jest.mock('~/gigs/repository', () => ({
    GigRepository: class GigRepository {},
    ReportRepository: class ReportRepository {},
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';
import { ReportTalent } from './index';

describe('ReportTalent service', () => {
    it('creates a moderation report and alerts admins', async () => {
        const gigRepository = {
            getGigById: jest.fn().mockResolvedValue({
                id: 'gig-1',
                employerId: 'employer-1',
                title: 'Wedding of Mike and Sarah #MS2025',
            }),
            findApplicationByGigAndTalent: jest.fn().mockResolvedValue({
                id: 'application-1',
                status: 'hired',
            }),
        };
        const reportRepository = {
            findOpenReport: jest.fn().mockResolvedValue(null),
            createReport: jest.fn().mockResolvedValue({
                id: 'report-1',
                reporterId: 'employer-1',
                reportedUserId: 'talent-1',
            }),
        };
        const userRepository = {
            getAllUsers: jest.fn().mockResolvedValue([
                {
                    id: 'admin-1',
                },
            ]),
        };

        const service = new ReportTalent(gigRepository as never, reportRepository as never, userRepository as never);

        const response = await service.handle({
            params: { id: 'gig-1' },
            input: {
                talentId: 'talent-1',
                category: 'conduct',
                reason: 'The selected talent did not show up for the event.',
            },
            request: {
                user: { id: 'employer-1' },
                headers: {},
                ip: '127.0.0.1',
            },
        } as never);

        expect(reportRepository.createReport).toHaveBeenCalledWith(
            expect.objectContaining({
                gigId: 'gig-1',
                reportedUserId: 'talent-1',
            }),
        );
        expect(notificationDispatcher.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'admin-1',
                type: 'security_alert',
            }),
        );
        expect(response.message).toBe('Talent Report Submitted Successfully');
    });
});
