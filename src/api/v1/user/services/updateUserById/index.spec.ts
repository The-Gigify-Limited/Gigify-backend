jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    return {
        BadRequestError,
        HttpStatus: { OK: 200 },
        imageUploadService: {
            upload: jest.fn(),
        },
    };
});

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

import { BadRequestError, imageUploadService } from '@/core';
import { UpdateUserById } from './index';

function makeRepo() {
    const updatedRow = {
        id: 'user-1',
        first_name: 'Maxwell',
        last_name: 'Adeyemi',
        date_of_birth: '1995-06-15',
        street_address: '24 Allen Avenue',
        acquisition_source: 'referral',
        bio: 'DJ and event producer based in Lagos.',
    };

    return {
        updatedRow,
        updateById: jest.fn().mockResolvedValue(updatedRow),
        mapToCamelCase: jest.fn((row: Record<string, unknown>) =>
            Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])),
        ),
    };
}

describe('UpdateUserById service', () => {
    beforeEach(() => {
        (imageUploadService.upload as jest.Mock).mockReset();
    });

    it('forwards the four new onboarding fields to the repository and returns them in camelCase', async () => {
        const repo = makeRepo();
        const service = new UpdateUserById(repo as never);

        const response = await service.handle({
            params: { id: 'user-1' },
            input: {
                firstName: 'Maxwell',
                dateOfBirth: '1995-06-15',
                streetAddress: '24 Allen Avenue',
                acquisitionSource: 'referral',
                bio: 'DJ and event producer based in Lagos.',
            },
        } as never);

        expect(repo.updateById).toHaveBeenCalledWith('user-1', {
            firstName: 'Maxwell',
            dateOfBirth: '1995-06-15',
            streetAddress: '24 Allen Avenue',
            acquisitionSource: 'referral',
            bio: 'DJ and event producer based in Lagos.',
        });

        expect(response.data).toEqual(
            expect.objectContaining({
                dateOfBirth: '1995-06-15',
                streetAddress: '24 Allen Avenue',
                acquisitionSource: 'referral',
                bio: 'DJ and event producer based in Lagos.',
            }),
        );
        expect(response.code).toBe(200);
    });

    it('throws BadRequestError when the user id is missing', async () => {
        const repo = makeRepo();
        const service = new UpdateUserById(repo as never);

        await expect(
            service.handle({
                params: {},
                input: { firstName: 'Maxwell' },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestError);

        expect(repo.updateById).not.toHaveBeenCalled();
    });

    it('uploads a profile image when provided and swaps the returned URL into the payload', async () => {
        const repo = makeRepo();
        (imageUploadService.upload as jest.Mock).mockResolvedValue({ publicUrl: 'https://cdn/example.png' });

        const service = new UpdateUserById(repo as never);

        const imageFile = { name: 'avatar.png' };

        await service.handle({
            params: { id: 'user-1' },
            files: { profileImage: imageFile },
            input: { firstName: 'Maxwell' },
        } as never);

        expect(imageUploadService.upload).toHaveBeenCalledWith(
            imageFile,
            expect.objectContaining({ bucket: 'avatars', folder: 'profiles', userId: 'user-1' }),
        );
        expect(repo.updateById).toHaveBeenCalledWith(
            'user-1',
            expect.objectContaining({ profileImageUrl: 'https://cdn/example.png', firstName: 'Maxwell' }),
        );
    });
});
