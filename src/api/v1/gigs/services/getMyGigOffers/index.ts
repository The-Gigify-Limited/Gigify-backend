import { ControllerArgs, HttpStatus, UnAuthorizedError } from '@/core';
import { UserRepository } from '~/user/repository';
import { GetGigOffersDto } from '../../interfaces';
import { GigOfferRepository, GigRepository } from '../../repository';

export class GetMyGigOffers {
    constructor(
        private readonly gigOfferRepository: GigOfferRepository,
        private readonly gigRepository: GigRepository,
        private readonly userRepository: UserRepository,
    ) {}

    handle = async ({ query, request }: ControllerArgs<GetGigOffersDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const direction = query.direction ?? (request.user?.role === 'talent' ? 'received' : 'sent');
        const offers = await this.gigOfferRepository.getOffersForUser(userId, {
            ...query,
            direction,
        });

        const gigIds = Array.from(new Set(offers.map((offer) => offer.gigId)));
        const userIds = Array.from(new Set(offers.flatMap((offer) => [offer.employerId, offer.talentId])));
        const [gigs, users] = await Promise.all([
            this.gigRepository.getGigsByIds(gigIds),
            Promise.all(userIds.map(async (id) => this.userRepository.findById(id))),
        ]);

        const gigMap = new Map(gigs.map((gig) => [gig.id, gig]));
        const userMap = new Map(
            userIds.map((id, index) => {
                const user = users[index];
                return [id, user ? this.userRepository.mapToCamelCase(user) : null];
            }),
        );

        return {
            code: HttpStatus.OK,
            message: 'Gig Offers Retrieved Successfully',
            data: offers.map((offer) => ({
                ...offer,
                gig: gigMap.get(offer.gigId) ?? null,
                employer: userMap.get(offer.employerId) ?? null,
                talent: userMap.get(offer.talentId) ?? null,
            })),
        };
    };
}

const getMyGigOffers = new GetMyGigOffers(new GigOfferRepository(), new GigRepository(), new UserRepository());

export default getMyGigOffers;
