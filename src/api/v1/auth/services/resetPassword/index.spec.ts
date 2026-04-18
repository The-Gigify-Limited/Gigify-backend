const mockGetUser = jest.fn();
const mockUpdateUserById = jest.fn();

jest.mock('@/core', () => {
    class BaseService {
        supabase = {
            auth: {
                getUser: mockGetUser,
                admin: {
                    updateUserById: mockUpdateUserById,
                },
            },
        };
    }

    class BadRequestError extends Error {}
    class ServerError extends Error {}
    class UnAuthorizedError extends Error {}

    return {
        BaseService,
        BadRequestError,
        HttpStatus: { OK: 200 },
        ServerError,
        UnAuthorizedError,
        logger: {
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
        },
    };
});

import { BadRequestError, ServerError, UnAuthorizedError } from '@/core';
import { ResetPassword } from './index';

function makeArgs(overrides: { password?: string; authorization?: string | string[] | null } = {}) {
    const password = overrides.password ?? 'Password1!';
    const authorization = 'authorization' in overrides ? overrides.authorization : 'Bearer valid-recovery-token';
    return {
        input: { password },
        headers: authorization == null ? {} : { authorization },
    } as never;
}

describe('ResetPassword service', () => {
    beforeEach(() => {
        mockGetUser.mockReset();
        mockUpdateUserById.mockReset();
    });

    it('resets the password when the recovery token is valid', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
        mockUpdateUserById.mockResolvedValue({ error: null });

        const service = new ResetPassword();

        const response = await service.handle(makeArgs());

        expect(mockGetUser).toHaveBeenCalledWith('valid-recovery-token');
        expect(mockUpdateUserById).toHaveBeenCalledWith('user-1', { password: 'Password1!' });
        expect(response.code).toBe(200);
        expect(response.message).toContain('reset successfully');
    });

    it('throws UnAuthorizedError when the authorization header is missing', async () => {
        const service = new ResetPassword();

        await expect(service.handle(makeArgs({ authorization: undefined }))).rejects.toBeInstanceOf(UnAuthorizedError);
        expect(mockGetUser).not.toHaveBeenCalled();
        expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it('throws UnAuthorizedError when the authorization header is not a Bearer scheme', async () => {
        const service = new ResetPassword();

        await expect(service.handle(makeArgs({ authorization: 'Basic abc123' }))).rejects.toBeInstanceOf(UnAuthorizedError);
        expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('throws UnAuthorizedError when Supabase rejects the token', async () => {
        mockGetUser.mockResolvedValue({ data: null, error: { status: 401, code: 'invalid_token' } });

        const service = new ResetPassword();

        await expect(service.handle(makeArgs())).rejects.toBeInstanceOf(UnAuthorizedError);
        expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it('throws UnAuthorizedError when Supabase returns no user for the token', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const service = new ResetPassword();

        await expect(service.handle(makeArgs())).rejects.toBeInstanceOf(UnAuthorizedError);
        expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it('throws BadRequestError when password is missing', async () => {
        const service = new ResetPassword();

        await expect(service.handle(makeArgs({ password: '' }))).rejects.toBeInstanceOf(BadRequestError);
        expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('throws ServerError when Supabase fails to update the password', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
        mockUpdateUserById.mockResolvedValue({ error: { status: 500, code: 'unexpected_failure', message: 'boom' } });

        const service = new ResetPassword();

        await expect(service.handle(makeArgs())).rejects.toBeInstanceOf(ServerError);
    });
});
