jest.mock('@/core', () => {
    class BadRequestError extends Error {}

    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
    };
});

jest.mock('@/app', () => ({
    dispatch: jest.fn(),
}));

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

import { dispatch } from '@/app';
import { GetUserById } from './index';

const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'male',
    phoneNumber: '+2348100000001',
    profileImageUrl: null,
    locationCity: 'Lagos',
    locationCountry: 'Nigeria',
    onboardingStep: 3,
    isVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    status: 'active',
    role: 'talent',
};

const emptyReviewData = { reviews: [], summary: [] };

describe('GetUserById service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('retrieves user with base profile shape', async () => {
        (dispatch as jest.Mock).mockResolvedValue([emptyReviewData]);

        const userRepository = {
            findById: jest.fn().mockResolvedValue({ id: 'user-1', first_name: 'John' }),
            mapToCamelCase: jest.fn().mockReturnValue(mockUser),
        };

        const service = new GetUserById(userRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            query: {},
        } as never);

        expect(userRepository.findById).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('User Fetched Successfully');

        const profile = response.data.user!;
        expect(profile.firstName).toBe('John');
        expect(profile.avgRating).toBe(0);
        expect(profile.totalRaters).toBe(0);
        expect(profile.eachRatingCount).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        expect(profile.onboarded).toBe(true);
        expect(profile.reviews).toEqual([]);
    });

    it('computes rating stats from review summary', async () => {
        (dispatch as jest.Mock).mockResolvedValue([
            {
                reviews: [{ id: 'r1', rating: 5 }],
                summary: [
                    { rating: 5, count: 3 },
                    { rating: 4, count: 1 },
                ],
            },
        ]);

        const userRepository = {
            findById: jest.fn().mockResolvedValue({ id: 'user-1' }),
            mapToCamelCase: jest.fn().mockReturnValue(mockUser),
        };

        const service = new GetUserById(userRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            query: {},
        } as never);

        const profile = response.data.user!;
        expect(profile.totalRaters).toBe(4);
        expect(profile.avgRating).toBeCloseTo(4.75);
        expect(profile.eachRatingCount[5]).toBe(3);
        expect(profile.eachRatingCount[4]).toBe(1);
    });

    it('retrieves full talent profile when requested', async () => {
        (dispatch as jest.Mock).mockResolvedValueOnce([emptyReviewData]).mockResolvedValueOnce([{ id: 'talent-1', bio: 'Skilled designer' }]);

        const userRepository = {
            findById: jest.fn().mockResolvedValue({ id: 'user-1', role: 'talent' }),
            mapToCamelCase: jest.fn().mockReturnValue(mockUser),
        };

        const service = new GetUserById(userRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            query: { full_profile: true },
        } as never);

        expect(dispatch).toHaveBeenCalledWith('talent:get-talent-profile', { user_id: 'user-1' });
        expect(response.data.talentProfile).toBeDefined();
    });

    it('retrieves full employer profile when requested', async () => {
        (dispatch as jest.Mock).mockResolvedValueOnce([emptyReviewData]).mockResolvedValueOnce([{ id: 'employer-1', companyName: 'Acme Corp' }]);

        const userRepository = {
            findById: jest.fn().mockResolvedValue({ id: 'user-1', role: 'employer' }),
            mapToCamelCase: jest.fn().mockReturnValue({ ...mockUser, role: 'employer' }),
        };

        const service = new GetUserById(userRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            query: { full_profile: true },
        } as never);

        expect(dispatch).toHaveBeenCalledWith('employer:get-profile', { user_id: 'user-1' });
        expect(response.data.employerProfile).toBeDefined();
    });

    it('throws when params are invalid', async () => {
        const userRepository = {
            findById: jest.fn(),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetUserById(userRepository as never);

        await expect(
            service.handle({
                params: undefined,
                query: {},
            } as never),
        ).rejects.toThrow('Invalid user ID');

        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('throws when user not found', async () => {
        const userRepository = {
            findById: jest.fn().mockResolvedValue(null),
            mapToCamelCase: jest.fn(),
        };

        const service = new GetUserById(userRepository as never);

        await expect(
            service.handle({
                params: { id: 'user-1' },
                query: {},
            } as never),
        ).rejects.toThrow('Invalid user ID');
    });
});
