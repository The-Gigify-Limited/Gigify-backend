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

describe('GetUserById service', () => {
    it('retrieves basic user data', async () => {
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'user@example.com',
                first_name: 'John',
                last_name: 'Doe',
                role: 'talent',
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'user-1',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'talent',
            }),
        };

        const service = new GetUserById(userRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            query: {},
        } as never);

        expect(userRepository.findById).toHaveBeenCalledWith('user-1');
        expect(response.message).toBe('User Fetched Successfully');
        expect(response.data.user!.firstName).toBe('John');
        expect(response.data.talentProfile).toBeUndefined();
    });

    it('retrieves full talent profile when requested', async () => {
        (dispatch as jest.Mock).mockResolvedValue([{ id: 'talent-1', bio: 'Skilled designer' }]);

        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'user-1',
                role: 'talent',
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'user-1',
                role: 'talent',
            }),
        };

        const service = new GetUserById(userRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            query: { full_profile: true },
        } as never);

        expect(dispatch).toHaveBeenCalledWith('talent:get-talent-profile', { user_id: 'user-1' });
        expect(response.data.talentProfile).not.toBeUndefined();
    });

    it('retrieves full employer profile when requested', async () => {
        (dispatch as jest.Mock).mockResolvedValue([{ id: 'employer-1', companyName: 'Acme Corp' }]);

        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'user-1',
                role: 'employer',
            }),
            mapToCamelCase: jest.fn().mockReturnValue({
                id: 'user-1',
                role: 'employer',
            }),
        };

        const service = new GetUserById(userRepository as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            query: { full_profile: true },
        } as never);

        expect(dispatch).toHaveBeenCalledWith('employer:get-profile', { user_id: 'user-1' });
        expect(response.data.employerProfile).not.toBeUndefined();
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
