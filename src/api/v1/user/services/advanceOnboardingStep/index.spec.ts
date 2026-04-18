const mockDispatch = jest.fn();

jest.mock('@/app', () => ({
    dispatch: mockDispatch,
}));

jest.mock('@/core', () => {
    class BadRequestError extends Error {}
    class ConflictError extends Error {}
    class RouteNotFoundError extends Error {}
    class UnAuthorizedError extends Error {}
    class UnProcessableError extends Error {}

    return {
        BadRequestError,
        ConflictError,
        HttpStatus: { OK: 200 },
        RouteNotFoundError,
        UnAuthorizedError,
        UnProcessableError,
    };
});

jest.mock('~/user/repository', () => ({
    UserRepository: class UserRepository {},
}));

jest.mock('~/talents/repository', () => ({
    TalentRepository: class TalentRepository {},
}));

jest.mock('~/employers/repository', () => ({
    EmployerRepository: class EmployerRepository {},
}));

import { BadRequestError, ConflictError, RouteNotFoundError, UnAuthorizedError, UnProcessableError } from '@/core';
import { AdvanceOnboardingStep } from './index';

type UserRow = {
    id: string;
    role: 'talent' | 'employer' | 'admin' | null;
    onboarding_step: number | null;
};

function makeRepos(overrides: { userRow?: Partial<UserRow>; talentExists?: boolean } = {}) {
    const userRow: UserRow = {
        id: 'user-1',
        role: 'talent',
        onboarding_step: 0,
        ...overrides.userRow,
    };

    const userRepository = {
        findById: jest.fn().mockResolvedValue(userRow),
        updateById: jest.fn().mockImplementation((id: string, updates: Record<string, unknown>) => ({
            ...userRow,
            ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`), v])),
        })),
        mapToCamelCase: jest.fn((row: Record<string, unknown>) =>
            Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])),
        ),
    };

    const talentRepository = {
        findByUserId: jest.fn().mockResolvedValue(overrides.talentExists === false ? null : { id: 'talent-1', userId: userRow.id }),
        updateById: jest.fn().mockResolvedValue({ id: 'talent-1' }),
    };

    const employerRepository = {
        upsertEmployerProfile: jest.fn().mockResolvedValue({ id: 'employer-1', userId: userRow.id }),
    };

    return { userRepository, talentRepository, employerRepository };
}

function buildArgs(step: 1 | 2 | 3, payload: Record<string, unknown>, userId = 'user-1') {
    return {
        input: { step, payload },
        request: { user: { id: userId } },
    } as never;
}

describe('AdvanceOnboardingStep service', () => {
    beforeEach(() => {
        mockDispatch.mockReset().mockResolvedValue([]);
    });

    it('advances step 1 with all required fields and dispatches the completion event', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({ userRow: { onboarding_step: 0 } });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        const response = await service.handle(
            buildArgs(1, {
                firstName: 'Maxwell',
                lastName: 'Adeyemi',
                dateOfBirth: '1995-06-15',
            }),
        );

        expect(userRepository.updateById).toHaveBeenCalledWith(
            'user-1',
            expect.objectContaining({
                firstName: 'Maxwell',
                lastName: 'Adeyemi',
                dateOfBirth: '1995-06-15',
                onboardingStep: 1,
            }),
        );
        expect(mockDispatch).toHaveBeenCalledWith('user:onboarding-step-completed', {
            userId: 'user-1',
            step: 1,
            role: 'talent',
        });
        expect(response.code).toBe(200);
        expect(response.data.onboarded).toBe(false);
    });

    it('advances step 2 and persists location + phone fields', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({ userRow: { onboarding_step: 1 } });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        await service.handle(
            buildArgs(2, {
                locationCountry: 'Nigeria',
                locationCity: 'Lagos',
                streetAddress: '24 Allen Avenue',
                phoneNumber: '+234810000001',
            }),
        );

        expect(userRepository.updateById).toHaveBeenCalledWith(
            'user-1',
            expect.objectContaining({
                locationCountry: 'Nigeria',
                locationCity: 'Lagos',
                streetAddress: '24 Allen Avenue',
                phoneNumber: '+234810000001',
                onboardingStep: 2,
            }),
        );
    });

    it('advances step 3 for a talent: updates talent_profiles, marks user onboarded', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({
            userRow: { onboarding_step: 2, role: 'talent' },
        });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        const response = await service.handle(
            buildArgs(3, {
                stageName: 'DJ Maxell',
                primaryRole: 'DJ',
                skills: ['afrobeat'],
                minRate: 120000,
            }),
        );

        expect(talentRepository.findByUserId).toHaveBeenCalledWith('user-1');
        expect(talentRepository.updateById).toHaveBeenCalledWith('talent-1', {
            stageName: 'DJ Maxell',
            primaryRole: 'DJ',
            skills: ['afrobeat'],
            minRate: 120000,
        });
        expect(userRepository.updateById).toHaveBeenCalledWith('user-1', expect.objectContaining({ onboardingStep: 3 }));
        expect(response.data.onboarded).toBe(true);
        expect(employerRepository.upsertEmployerProfile).not.toHaveBeenCalled();
    });

    it('advances step 3 for an employer: upserts employer_profiles', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({
            userRow: { onboarding_step: 2, role: 'employer' },
        });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        await service.handle(
            buildArgs(3, {
                organizationName: 'Pulse Live',
                industry: 'Entertainment',
            }),
        );

        expect(employerRepository.upsertEmployerProfile).toHaveBeenCalledWith('user-1', {
            organizationName: 'Pulse Live',
            industry: 'Entertainment',
        });
        expect(talentRepository.updateById).not.toHaveBeenCalled();
    });

    it('throws ConflictError when the user tries to advance out of order', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({ userRow: { onboarding_step: 0 } });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        await expect(
            service.handle(
                buildArgs(3, {
                    stageName: 'DJ Maxell',
                    primaryRole: 'DJ',
                    skills: ['afrobeat'],
                    minRate: 120000,
                }),
            ),
        ).rejects.toBeInstanceOf(ConflictError);

        expect(userRepository.updateById).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('throws UnProcessableError when required fields are missing for the step', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({ userRow: { onboarding_step: 0 } });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        await expect(
            service.handle(
                buildArgs(1, {
                    firstName: 'Maxwell',
                }),
            ),
        ).rejects.toBeInstanceOf(UnProcessableError);

        expect(userRepository.updateById).not.toHaveBeenCalled();
    });

    it('treats empty strings and empty arrays as missing values', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({
            userRow: { onboarding_step: 2, role: 'talent' },
        });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        await expect(
            service.handle(
                buildArgs(3, {
                    stageName: 'DJ Maxell',
                    primaryRole: '   ',
                    skills: [],
                    minRate: 0,
                }),
            ),
        ).rejects.toBeInstanceOf(UnProcessableError);
    });

    it('throws BadRequestError on step 3 for an unexpected role', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({
            userRow: { onboarding_step: 2, role: 'admin' },
        });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        await expect(
            service.handle(
                buildArgs(3, {
                    organizationName: 'Pulse Live',
                    industry: 'Entertainment',
                }),
            ),
        ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('throws UnAuthorizedError when the request has no authenticated user', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos();
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        await expect(
            service.handle({
                input: { step: 1, payload: {} },
                request: { user: undefined },
            } as never),
        ).rejects.toBeInstanceOf(UnAuthorizedError);
    });

    it('throws RouteNotFoundError when step 3 fires for a talent whose profile row is missing', async () => {
        const { userRepository, talentRepository, employerRepository } = makeRepos({
            userRow: { onboarding_step: 2, role: 'talent' },
            talentExists: false,
        });
        const service = new AdvanceOnboardingStep(userRepository as never, talentRepository as never, employerRepository as never);

        await expect(
            service.handle(
                buildArgs(3, {
                    stageName: 'DJ Maxell',
                    primaryRole: 'DJ',
                    skills: ['afrobeat'],
                    minRate: 120000,
                }),
            ),
        ).rejects.toBeInstanceOf(RouteNotFoundError);
    });
});
