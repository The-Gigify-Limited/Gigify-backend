import type { ControllerArgsTypes } from '@/core';
import { EmployerProfile } from './module.types';

export interface UpsertEmployerProfileDto extends ControllerArgsTypes {
    input: Partial<Pick<EmployerProfile, 'organizationName' | 'companyWebsite' | 'industry'>>;
}
