import { supabaseAdmin } from '@/core/config/database';
import { BaseRepository } from '@/core/repository';
import { Database } from '@/core/types';
import { Resources } from '../interface';

type TableConfig = {
    table: keyof Database['public']['Tables'];
    ownerColumn: string;
};

export class ResourceRepository extends BaseRepository<any, any> {
    protected readonly table = 'users';

    async isResourceOwner(userId: string, resourceType: Resources, resourceId: string): Promise<boolean> {
        const { table, ownerColumn } = this.getTableConfig(resourceType);

        const { data, error } = await supabaseAdmin.from(table).select(ownerColumn).eq('id', resourceId).single();

        if (error || !data) return false;

        return (data as any)[ownerColumn] === userId;
    }

    async getResourceOwner(resourceType: Resources, resourceId: string): Promise<string | null> {
        const { table, ownerColumn } = this.getTableConfig(resourceType);

        const { data, error } = await supabaseAdmin.from(table).select(ownerColumn).eq('id', resourceId).single();

        if (error || !data) return null;
        return (data as any)[ownerColumn] || null;
    }

    private getTableConfig(resourceType: Resources): TableConfig {
        const tableMap: Record<Resources, TableConfig> = {
            user: { table: 'users', ownerColumn: 'id' },
            gig: { table: 'gigs', ownerColumn: 'user_id' },
            review: { table: 'talent_reviews', ownerColumn: 'user_id' },
            payment: { table: 'users', ownerColumn: 'user_id' },
            talent: { table: 'talent_profiles', ownerColumn: 'user_id' },
        };

        return tableMap[resourceType];
    }
}
