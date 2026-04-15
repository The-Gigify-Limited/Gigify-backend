import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { GetMyGigsDto, TalentGigItem } from '~/gigs/interfaces';
import { GigRepository } from '~/gigs/repository';

const isAppliedItem = (item: TalentGigItem) => ['submitted', 'reviewing', 'shortlisted'].includes(item.application.status);
const isUpcomingItem = (item: TalentGigItem) =>
    item.application.status === 'hired' &&
    Boolean(item.gig) &&
    item.gig?.status !== 'completed' &&
    new Date(item.gig?.gigDate ?? 0).getTime() > Date.now();
const isActiveItem = (item: TalentGigItem) => item.application.status === 'hired' && item.gig?.status === 'in_progress';
const isCompletedItem = (item: TalentGigItem) => item.application.status === 'hired' && ['completed', 'cancelled'].includes(item.gig?.status ?? '');

export class GetMyGigs {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async ({ params, query, request }: ControllerArgs<GetMyGigsDto>) => {
        const talentId = request.user?.id;

        if (!talentId) throw new UnAuthorizedError('User not authenticated');

        const items = await this.gigRepository.getTalentGigItems(talentId, query);

        const filteredItems = items.filter((item) => {
            switch (params.status) {
                case 'applied':
                    return isAppliedItem(item);
                case 'upcoming':
                    return isUpcomingItem(item);
                case 'active':
                    return isActiveItem(item);
                case 'completed':
                    return isCompletedItem(item);
                default:
                    return false;
            }
        });

        return {
            code: HttpStatus.OK,
            message: 'My Gigs Retrieved Successfully',
            data: filteredItems,
        };
    };
}

const getMyGigs = new GetMyGigs(new GigRepository());

export default getMyGigs;
