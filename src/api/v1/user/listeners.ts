import { User } from './interfaces';
import { UserRepository } from './repository';

export async function getUserByIdEventListener(id: string, fields?: (keyof User)[]): Promise<Partial<User> | null> {
    const userRepository = new UserRepository();
    const existingUser = await userRepository.findById(id, fields as any);
    if (!existingUser) return null;

    const convertedUser = userRepository.mapToCamelCase(existingUser);
    if (!convertedUser) return null;

    return convertedUser;
}
