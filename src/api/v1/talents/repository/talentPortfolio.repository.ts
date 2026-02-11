import { BadRequestError, BaseRepository, supabaseAdmin } from '@/core';
import { DatabaseTalentPortfolio, TalentPortfolio } from '../interfaces';

export class TalentPortfolioRepository extends BaseRepository<DatabaseTalentPortfolio, TalentPortfolio> {
    protected readonly table = 'talent_portfolios' as const;

    constructor() {
        super();
    }

    async findByTalentId(talentId: string): Promise<TalentPortfolio[]> {
        const { data, error } = await supabaseAdmin.from(this.table).select('*').eq('talent_id', talentId);

        if (error) throw error;

        const convertedPortfolios = data?.map(this.mapToCamelCase) ?? [];

        return convertedPortfolios;
    }

    async deleteTalentPortfolio(talentPortfolioId: string): Promise<null> {
        const talentPortfolio = await this.findById(talentPortfolioId);
        if (!talentPortfolio) throw new BadRequestError('Talent Portfolio not Found!');

        const { error } = await supabaseAdmin.from(this.table).delete().eq('id', talentPortfolioId);
        if (error) throw new Error(error.message);

        return null;
    }

    async deleteTalentPortfolioForUser(userId: string): Promise<null> {
        const talentPortfolios = await this.findByTalentId(userId);
        if (!talentPortfolios.length) throw new BadRequestError('Talent Portfolio not Found!');

        const { error } = await supabaseAdmin.from(this.table).delete().eq('talent_id', userId);
        if (error) throw new Error(error.message);

        return null;
    }

    async createTalentPortfolios(talentId: string, portfolioUrls: string[]): Promise<TalentPortfolio[]> {
        const rows = portfolioUrls.map((url) => ({
            talent_id: talentId,
            portfolio_url: url,
            view_count: 0,
        }));

        const { data, error } = await supabaseAdmin
            .from(this.table)
            .upsert(rows, {
                onConflict: 'talent_id, portfolio_url',
                ignoreDuplicates: true,
            })
            .select();

        if (error) {
            throw error;
        }

        return (data ?? []).map(this.mapToCamelCase);
    }
}

const talentPortfolioRepository = new TalentPortfolioRepository();
export default talentPortfolioRepository;
