import { BadRequestError, BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { DatabaseUser, User, UserRoleEnum } from '../interfaces';

export class UserRepository extends BaseRepository<DatabaseUser, User> {
    protected readonly table = 'users';

    constructor() {
        super();
    }

    async getAllUsers(query: { page?: number | string; pageSize?: number | string; role?: UserRoleEnum; search?: string }): Promise<User[]> {
        const { offset, rangeEnd } = normalizePagination({ page: query.page, pageSize: query.pageSize });

        let request = supabaseAdmin.from('users').select('*');

        if (query.role) request = request.eq('role', query.role);

        if (query.search) {
            const s = `%${query.search}%`;
            request = request.or(`first_name.ilike.${s},last_name.ilike.${s},username.ilike.${s}`);
        }

        const { data = [], error } = await request.order('created_at', { ascending: false }).range(offset, rangeEnd);

        if (error) throw new Error(error.message);

        const convertedUsers = data?.map(this.mapToCamelCase) ?? [];

        return convertedUsers;
    }

    async deleteUser(userId: string): Promise<null> {
        const user = await this.findById(userId);
        if (!user) throw new BadRequestError('User not Found!');

        const { error } = await supabaseAdmin.from('users').delete().eq('id', userId);
        if (error) throw new Error(error.message);

        return null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabaseAdmin.from('users').select('*').eq('email', email).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async createUserPreSignup(id: string, email: string): Promise<User> {
        const { data, error } = await supabaseAdmin
            .from('users')
            .upsert(
                {
                    id,
                    email,
                },
                {
                    onConflict: 'id',
                    ignoreDuplicates: false,
                },
            )
            .select()
            .single();

        if (error) {
            throw error;
        }

        return this.mapToCamelCase(data);
    }
}

const userRepository = new UserRepository();
export default userRepository;
