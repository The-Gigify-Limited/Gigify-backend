import { supabaseAdmin } from '@/core/config/database';
import { BaseRepository } from '@/core/repository';
import { Database } from '@/core/types';
import { Resources } from '../interface';

type TableConfig = {
    table: keyof Database['public']['Tables'];
    ownerColumn: string;
};

export class ResourceRepository extends BaseRepository<Record<string, unknown>, Record<string, unknown>> {
    protected readonly table = 'users';

    async isResourceOwner(userId: string, resourceType: Resources, resourceId: string): Promise<boolean> {
        const { table, ownerColumn } = this.getTableConfig(resourceType);

        // @ts-expect-error — dynamic table name prevents Supabase from narrowing column types
        const { data, error } = await supabaseAdmin.from(table).select(ownerColumn).eq('id', resourceId).single();

        if (error || !data) return false;

        return (data as unknown as Record<string, unknown>)[ownerColumn] === userId;
    }

    async getResourceOwner(resourceType: Resources, resourceId: string): Promise<string | null> {
        const { table, ownerColumn } = this.getTableConfig(resourceType);

        // @ts-expect-error — dynamic table name prevents Supabase from narrowing column types
        const { data, error } = await supabaseAdmin.from(table).select(ownerColumn).eq('id', resourceId).single();

        if (error || !data) return null;
        return ((data as unknown as Record<string, unknown>)[ownerColumn] as string) || null;
    }

    private getTableConfig(resourceType: Resources): TableConfig {
        const tableMap: Record<Resources, TableConfig> = {
            user: { table: 'users', ownerColumn: 'id' },
            gig: { table: 'gigs', ownerColumn: 'employer_id' },
            review: { table: 'talent_reviews', ownerColumn: 'reviewer_id' },
            payment: { table: 'payments', ownerColumn: 'employer_id' },
            talent: { table: 'talent_profiles', ownerColumn: 'user_id' },
        };

        return tableMap[resourceType];
    }
}
