import { EmployerProfile } from './interfaces';
import { EmployerRepository } from './repository';

export async function createEmployerProfileListener(user_id: string): Promise<EmployerProfile | null> {
    const employerRepository = new EmployerRepository();
    const profile = await employerRepository.createEmployerProfile(user_id);
    return profile;
}

export async function getEmployerProfileByUserIdEventListener(user_id: string): Promise<EmployerProfile | null> {
    const employerRepository = new EmployerRepository();
    const profile = await employerRepository.findByUserId(user_id);

    if (!profile) return null;

    const totalApplicationsReceived = await employerRepository.countTotalApplicationsReceived(user_id);

    return {
        ...profile,
        totalApplicationsReceived,
    };
}
