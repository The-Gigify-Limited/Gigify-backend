import { dispatch } from '@/app';
import { BadRequestError, ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, UnProcessableError } from '@/core';
import { EmployerRepository } from '~/employers/repository';
import { TalentRepository } from '~/talents/repository';
import { AdvanceOnboardingStepPayload } from '~/user/interfaces';
import { UserRepository } from '~/user/repository';

type StepNumber = 1 | 2 | 3;

const STEP_REQUIRED_FIELDS: Record<1 | 2, readonly string[]> = {
    1: ['firstName', 'lastName', 'dateOfBirth'],
    2: ['locationCountry', 'locationCity', 'streetAddress', 'phoneNumber'],
};

const STEP_3_REQUIRED_FIELDS_BY_ROLE: Record<'talent' | 'employer', readonly string[]> = {
    talent: ['stageName', 'primaryRole', 'skills', 'minRate'],
    employer: ['organizationName', 'industry'],
};

const USER_COLUMN_FIELDS = new Set(['firstName', 'lastName', 'dateOfBirth', 'locationCountry', 'locationCity', 'streetAddress', 'phoneNumber']);

export class AdvanceOnboardingStep {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly talentRepository: TalentRepository,
        private readonly employerRepository: EmployerRepository,
    ) {}

    handle = async ({ input, request }: ControllerArgs<AdvanceOnboardingStepPayload>) => {
        const authUserId = request.user?.id;
        if (!authUserId) throw new UnAuthorizedError('User not authenticated');

        if (!input) throw new BadRequestError('Request body is required');

        const step = input.step as StepNumber;
        const payload = input.payload ?? {};

        const currentUser = await this.userRepository.findById(authUserId);
        if (!currentUser) throw new RouteNotFoundError('User not found');

        const currentStep = (currentUser.onboarding_step as number | null) ?? 0;
        const expectedStep = step - 1;

        if (currentStep !== expectedStep) {
            throw new ConflictError(`Cannot advance to step ${step}: current onboarding step is ${currentStep}, expected ${expectedStep}.`);
        }

        const role = (currentUser.role as 'talent' | 'employer' | 'admin' | null) ?? null;

        this.assertRequiredFields(step, role, payload);

        if (step === 3 && role !== 'talent' && role !== 'employer') {
            throw new BadRequestError('Step 3 requires a role of talent or employer. Complete role selection first.');
        }

        const userColumnUpdates = this.pickUserColumnUpdates(payload);
        userColumnUpdates.onboardingStep = step;

        const updatedUserRow = await this.userRepository.updateById(authUserId, userColumnUpdates as never);
        const updatedUser = this.userRepository.mapToCamelCase(updatedUserRow);

        if (step === 3) {
            if (role === 'talent') {
                await this.persistTalentProfile(authUserId, payload);
            } else if (role === 'employer') {
                await this.persistEmployerProfile(authUserId, payload);
            }
        }

        await dispatch('user:onboarding-step-completed', {
            userId: authUserId,
            step,
            role,
        });

        return {
            code: HttpStatus.OK,
            message: `Onboarding step ${step} completed`,
            data: {
                ...updatedUser,
                onboarded: ((updatedUser.onboardingStep as number | null) ?? 0) >= 3,
            },
        };
    };

    private assertRequiredFields(step: StepNumber, role: 'talent' | 'employer' | 'admin' | null, payload: Record<string, unknown>): void {
        const required =
            step === 3 ? (role === 'talent' || role === 'employer' ? STEP_3_REQUIRED_FIELDS_BY_ROLE[role] : []) : STEP_REQUIRED_FIELDS[step];

        const missing = required.filter((field) => !hasValue(payload[field]));

        if (missing.length > 0) {
            throw new UnProcessableError(`Missing required field(s) for step ${step}: ${missing.join(', ')}`);
        }
    }

    private pickUserColumnUpdates(payload: Record<string, unknown>): Record<string, unknown> {
        const picked: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(payload)) {
            if (USER_COLUMN_FIELDS.has(key)) picked[key] = value;
        }
        return picked;
    }

    private async persistTalentProfile(userId: string, payload: Record<string, unknown>): Promise<void> {
        const updates: Record<string, unknown> = {};
        for (const field of STEP_3_REQUIRED_FIELDS_BY_ROLE.talent) {
            if (payload[field] !== undefined) updates[field] = payload[field];
        }

        const existing = await this.talentRepository.findByUserId(userId);
        if (!existing?.id) {
            throw new RouteNotFoundError('Talent profile not found. Ensure role is set before completing step 3.');
        }

        await this.talentRepository.updateById(existing.id, updates as never);
    }

    private async persistEmployerProfile(userId: string, payload: Record<string, unknown>): Promise<void> {
        const updates: Record<string, unknown> = {};
        for (const field of STEP_3_REQUIRED_FIELDS_BY_ROLE.employer) {
            if (payload[field] !== undefined) updates[field] = payload[field];
        }

        await this.employerRepository.upsertEmployerProfile(userId, updates as never);
    }
}

function hasValue(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
}

const advanceOnboardingStep = new AdvanceOnboardingStep(new UserRepository(), new TalentRepository(), new EmployerRepository());

export default advanceOnboardingStep;
