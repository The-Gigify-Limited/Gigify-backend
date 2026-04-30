import { BaseRepository, supabaseAdmin } from '@/core';
import { normalizePagination } from '@/core/utils/pagination';
import { BrowseSortBy, DatabaseTalent, Talent } from '../interfaces';

export type TalentBrowseRow = Talent & {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    locationLatitude: number | null;
    locationLongitude: number | null;
    averageRating: number;
    reviewCount: number;
};

export interface BrowseFilters {
    page?: number | string;
    pageSize?: number | string;
    search?: string;
    primaryRole?: string;
    genres?: string[];
    minRate?: number;
    maxRate?: number;
    rateCurrency?: string;
    minRating?: number;
    locationCity?: string;
    locationCountry?: string;
    radiusKm?: number;
    lat?: number;
    lng?: number;
    availableOn?: string;
    sortBy?: BrowseSortBy;
}

export class TalentRepository extends BaseRepository<DatabaseTalent, Talent> {
    protected readonly table = 'talent_profiles';

    constructor() {
        super();
    }

    async findByUserId(user_id: string): Promise<Talent | null> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('user_id', user_id).maybeSingle();

        if (error) throw error;

        return data ? this.mapToCamelCase(data) : null;
    }

    async findForBrowse(filters: BrowseFilters): Promise<TalentBrowseRow[]> {
        const { offset, rangeEnd } = normalizePagination(filters);

        // Supabase's `.select` embed pulls the joined users row under the
        // same query, avoids an N+1 on name / avatar / location. We embed
        // talent_reviews with aggregate support via a SQL view-like trick:
        // select with inner join on users, then compute rating aggregates
        // after the fact because PostgREST doesn't surface AVG cleanly in
        // embedded selects without a dedicated view.
        let request = supabaseAdmin.from(this.table).select(`
                *,
                user:users!inner(id, first_name, last_name, profile_image_url, location_city, location_country, location_latitude, location_longitude, role, status)
            `);

        request = request.eq('user.role', 'talent').eq('user.status', 'active');

        if (filters.primaryRole) {
            request = request.ilike('primary_role', `%${filters.primaryRole}%`);
        }
        if (filters.minRate !== undefined) {
            request = request.gte('min_rate', filters.minRate);
        }
        if (filters.maxRate !== undefined) {
            request = request.lte('max_rate', filters.maxRate);
        }
        if (filters.rateCurrency) {
            request = request.eq('rate_currency', filters.rateCurrency);
        }
        if (filters.locationCity) {
            request = request.eq('user.location_city', filters.locationCity);
        }
        if (filters.locationCountry) {
            request = request.eq('user.location_country', filters.locationCountry);
        }
        if (filters.genres && filters.genres.length > 0) {
            // `skills` is a text[]. The `cs` operator asks whether skills is a
            // superset of the provided array, effectively "has all listed
            // genres". For partial match use `ov` (overlaps). Product prefers
            // "any match" for discovery so we use overlaps.
            request = request.overlaps('skills', filters.genres);
        }
        if (filters.search) {
            const pattern = `%${filters.search}%`;

            // PostgREST `.or()` cannot reach an embedded table (the joined
            // `users` row) within the same OR group, so first_name / last_name
            // matches are resolved with a separate lookup against `users` and
            // folded back in via `user_id.in.(...)`.
            const { data: matchedUsers = [], error: matchedUsersError } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('role', 'talent')
                .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`);

            if (matchedUsersError) throw matchedUsersError;

            const matchedUserIds = (matchedUsers ?? []).map((row) => row.id);

            const orParts = [`stage_name.ilike.${pattern}`, `primary_role.ilike.${pattern}`];
            if (matchedUserIds.length > 0) {
                orParts.push(`user_id.in.(${matchedUserIds.join(',')})`);
            }

            request = request.or(orParts.join(','));
        }

        // Sort, default rating desc, applied after merging the ratings
        // aggregate below. For price / recent we can push down into SQL.
        if (filters.sortBy === 'priceAsc') {
            request = request.order('min_rate', { ascending: true, nullsFirst: false });
        } else if (filters.sortBy === 'priceDesc') {
            request = request.order('min_rate', { ascending: false, nullsFirst: false });
        } else {
            request = request.order('updated_at', { ascending: false, nullsFirst: false });
        }

        request = request.range(offset, rangeEnd);

        const { data = [], error } = await request;
        if (error) throw error;

        const rows = data ?? [];
        if (rows.length === 0) return [];

        const userIds = rows.map((row: Record<string, unknown>) => (row.user as { id: string }).id);

        const { data: ratingRows = [], error: ratingError } = await supabaseAdmin
            .from('talent_reviews')
            .select('talent_id, rating')
            .in('talent_id', userIds);
        if (ratingError) throw ratingError;

        const ratingAgg = new Map<string, { sum: number; count: number }>();
        for (const row of ratingRows ?? []) {
            if (!row.talent_id) continue;
            const current = ratingAgg.get(row.talent_id) ?? { sum: 0, count: 0 };
            current.sum += row.rating ?? 0;
            current.count += 1;
            ratingAgg.set(row.talent_id, current);
        }

        let result: TalentBrowseRow[] = rows.map((row: Record<string, unknown>) => {
            const user = row.user as {
                id: string;
                first_name: string | null;
                last_name: string | null;
                profile_image_url: string | null;
                location_city: string | null;
                location_country: string | null;
                location_latitude: number | null;
                location_longitude: number | null;
            };
            const { sum, count } = ratingAgg.get(user.id) ?? { sum: 0, count: 0 };
            const averageRating = count > 0 ? sum / count : 0;

            const profile = this.mapToCamelCase(row as never) as unknown as Talent;
            return {
                ...profile,
                userId: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                profileImageUrl: user.profile_image_url,
                locationCity: user.location_city,
                locationCountry: user.location_country,
                locationLatitude: user.location_latitude,
                locationLongitude: user.location_longitude,
                averageRating,
                reviewCount: count,
            };
        });

        if (filters.minRating !== undefined) {
            const min = filters.minRating;
            result = result.filter((r) => r.averageRating >= min);
        }

        if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusKm !== undefined) {
            const { lat, lng, radiusKm } = filters;
            result = result.filter((r) => {
                if (r.locationLatitude === null || r.locationLongitude === null) return false;
                return haversineKm(lat, lng, r.locationLatitude, r.locationLongitude) <= radiusKm;
            });
        }

        if (filters.availableOn) {
            const { data: busyRows = [], error: busyError } = await supabaseAdmin
                .from('talent_availability')
                .select('talent_user_id')
                .in('talent_user_id', userIds)
                .lte('unavailable_from', filters.availableOn)
                .gte('unavailable_until', filters.availableOn);
            if (busyError) throw busyError;

            const busy = new Set((busyRows ?? []).map((b) => b.talent_user_id));
            result = result.filter((r) => !busy.has(r.userId));
        }

        if (!filters.sortBy || filters.sortBy === 'rating') {
            result = result.sort((a, b) => b.averageRating - a.averageRating);
        }

        return result;
    }

    async countCompletedGigs(userId: string): Promise<number> {
        const { count, error } = await supabaseAdmin
            .from('gig_applications')
            .select('id, gigs!inner(status)', { count: 'exact', head: true })
            .eq('talent_id', userId)
            .eq('status', 'hired')
            .eq('gigs.status', 'completed');

        if (error) throw error;

        return count ?? 0;
    }

    async createTalentProfile(user_id: string): Promise<Talent> {
        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert(
                {
                    user_id,
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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
}

const talentRepository = new TalentRepository();
export default talentRepository;
