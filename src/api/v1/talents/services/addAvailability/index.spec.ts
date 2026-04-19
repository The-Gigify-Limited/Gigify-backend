jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class ForbiddenError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}
    return {
        BadRequestError,
        ConflictError,
        ForbiddenError,
        HttpStatus: { CREATED: 201, OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
    };
});

jest.mock('../../repository', () => ({
    AvailabilityRepository: class AvailabilityRepository {},
}));

import { BadRequestError, ConflictError, ForbiddenError } from '@/core';
import { AddAvailability } from './index';
import { DeleteAvailability } from '../deleteAvailability';
import { ListAvailability } from '../listAvailability';

describe('Availability services', () => {
    it('adds a manual availability block for the current talent', async () => {
        const availabilityRepository = {
            addManual: jest.fn().mockResolvedValue({ id: 'avail-1' }),
        };
        const service = new AddAvailability(availabilityRepository as never);

        const response = await service.handle({
            input: {
                unavailableFrom: '2026-05-01T00:00:00.000Z',
                unavailableUntil: '2026-05-02T00:00:00.000Z',
                reason: 'Travel',
            },
            request: { user: { id: 'talent-1', role: 'talent' } },
        } as never);

        expect(availabilityRepository.addManual).toHaveBeenCalledWith(expect.objectContaining({ talentUserId: 'talent-1', reason: 'Travel' }));
        expect(response.code).toBe(201);
    });

    it('rejects employers trying to mark themselves unavailable', async () => {
        const service = new AddAvailability({ addManual: jest.fn() } as never);
        await expect(
            service.handle({
                input: { unavailableFrom: '2026-05-01T00:00:00Z', unavailableUntil: '2026-05-02T00:00:00Z' },
                request: { user: { id: 'employer-1', role: 'employer' } },
            } as never),
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it('rejects ranges where until <= from', async () => {
        const service = new AddAvailability({ addManual: jest.fn() } as never);
        await expect(
            service.handle({
                input: { unavailableFrom: '2026-05-02T00:00:00Z', unavailableUntil: '2026-05-01T00:00:00Z' },
                request: { user: { id: 'talent-1', role: 'talent' } },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('lists availability within the supplied range', async () => {
        const availabilityRepository = {
            listForTalent: jest.fn().mockResolvedValue([{ id: 'avail-1' }]),
        };
        const service = new ListAvailability(availabilityRepository as never);

        await service.handle({
            params: { id: 'talent-1' },
            query: { from: '2026-05-01', to: '2026-05-31' },
        } as never);

        expect(availabilityRepository.listForTalent).toHaveBeenCalledWith('talent-1', {
            from: '2026-05-01',
            to: '2026-05-31',
        });
    });

    it('refuses to delete auto-from-gig rows (talents cannot fake availability while booked)', async () => {
        const availabilityRepository = {
            findAvailabilityById: jest.fn().mockResolvedValue({ id: 'avail-1', talentUserId: 'talent-1', source: 'auto_from_gig' }),
            deleteById: jest.fn(),
        };
        const service = new DeleteAvailability(availabilityRepository as never);

        await expect(
            service.handle({
                params: { id: 'avail-1' },
                request: { user: { id: 'talent-1' } },
            } as never),
        ).rejects.toBeInstanceOf(ForbiddenError);

        expect(availabilityRepository.deleteById).not.toHaveBeenCalled();
    });

    it('deletes a manual row owned by the caller', async () => {
        const availabilityRepository = {
            findAvailabilityById: jest.fn().mockResolvedValue({ id: 'avail-1', talentUserId: 'talent-1', source: 'manual' }),
            deleteById: jest.fn().mockResolvedValue(undefined),
        };
        const service = new DeleteAvailability(availabilityRepository as never);

        await service.handle({
            params: { id: 'avail-1' },
            request: { user: { id: 'talent-1' } },
        } as never);

        expect(availabilityRepository.deleteById).toHaveBeenCalledWith('avail-1');
    });

    it("refuses to delete another talent's row", async () => {
        const availabilityRepository = {
            findAvailabilityById: jest.fn().mockResolvedValue({ id: 'avail-1', talentUserId: 'owner', source: 'manual' }),
            deleteById: jest.fn(),
        };
        const service = new DeleteAvailability(availabilityRepository as never);

        await expect(
            service.handle({
                params: { id: 'avail-1' },
                request: { user: { id: 'stranger' } },
            } as never),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });
});
