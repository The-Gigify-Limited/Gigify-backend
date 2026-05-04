jest.mock('@/core', () => ({
    HttpStatus: { OK: 200 },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockDispatch = jest.fn().mockResolvedValue(undefined);

jest.mock('~/notifications/utils/dispatchNotification', () => ({
    notificationDispatcher: {
        dispatch: mockDispatch,
    },
}));

jest.mock('../../repository', () => ({
    GigRepository: class GigRepository {},
    GigReminderRepository: class GigReminderRepository {},
}));

import { SendGigReminders } from './index';

describe('SendGigReminders service', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
    });

    it('dispatches exactly one reminder per (gig, user, window) pair and marks it sent', async () => {
        // Build a gig whose start is roughly 24h from now so the 24h window catches it.
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60_000);
        const gigDate = in24h.toISOString().slice(0, 10);
        const gigStartTime = in24h.toISOString().slice(11, 19);

        const gigRepository = {
            findGigsStartingWithin: jest
                .fn()
                .mockResolvedValueOnce([{ id: 'gig-1', employerId: 'employer-1', title: 'Gig 1', gigDate, gigStartTime, gigEndTime: null }])
                // The 2h window returns nothing
                .mockResolvedValueOnce([]),
            findHiredTalentIdsForGig: jest.fn().mockResolvedValue(['talent-1']),
        };
        const gigReminderRepository = {
            hasSent: jest.fn().mockResolvedValue(false),
            markSent: jest.fn().mockResolvedValue(undefined),
        };

        const service = new SendGigReminders(gigRepository as never, gigReminderRepository as never);
        const response = await service.handle();

        expect(gigRepository.findGigsStartingWithin).toHaveBeenCalledTimes(2);
        expect(mockDispatch).toHaveBeenCalledTimes(2); // employer + talent
        expect(gigReminderRepository.markSent).toHaveBeenCalledWith('gig-1', 'employer-1', 24);
        expect(gigReminderRepository.markSent).toHaveBeenCalledWith('gig-1', 'talent-1', 24);
        expect(response.data).toEqual({ sentCount: 2 });
    });

    it('skips recipients already reminded for that window', async () => {
        const now = new Date();
        const in2h = new Date(now.getTime() + 2 * 60 * 60_000);
        const gigDate = in2h.toISOString().slice(0, 10);
        const gigStartTime = in2h.toISOString().slice(11, 19);

        const gigRepository = {
            findGigsStartingWithin: jest
                .fn()
                .mockResolvedValueOnce([]) // 24h window: nothing
                .mockResolvedValueOnce([{ id: 'gig-2', employerId: 'employer-2', title: 'Gig 2', gigDate, gigStartTime, gigEndTime: null }]),
            findHiredTalentIdsForGig: jest.fn().mockResolvedValue([]),
        };
        const gigReminderRepository = {
            hasSent: jest.fn().mockResolvedValue(true),
            markSent: jest.fn(),
        };

        const service = new SendGigReminders(gigRepository as never, gigReminderRepository as never);
        const response = await service.handle();

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(gigReminderRepository.markSent).not.toHaveBeenCalled();
        expect(response.data).toEqual({ sentCount: 0 });
    });
});
