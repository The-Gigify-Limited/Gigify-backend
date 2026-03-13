import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { UserRepository } from '~/user/repository';
import { GetGigOffersDto } from '../../interfaces';
import { GigOfferRepository, GigRepository } from '../../repository';

export class GetGigOffersForGig {
    constructor(
        private readonly gigRepository: GigRepository,
        private readonly gigOfferRepository: GigOfferRepository,
        private readonly userRepository: UserRepository,
    ) {}

    handle = async ({ params, query }: ControllerArgs<GetGigOffersDto>) => {
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');

        const offers = await this.gigOfferRepository.getOffersForGig(params.id, query);
        const userIds = Array.from(new Set(offers.flatMap((offer) => [offer.employerId, offer.talentId])));
        const users = await Promise.all(userIds.map(async (userId) => this.userRepository.findById(userId)));
        const userMap = new Map(
            userIds.map((userId, index) => {
                const user = users[index];
                return [userId, user ? this.userRepository.mapToCamelCase(user) : null];
            }),
        );

        return {
            code: HttpStatus.OK,
            message: 'Gig Offers Retrieved Successfully',
            data: offers.map((offer) => ({
                ...offer,
                gig,
                employer: userMap.get(offer.employerId) ?? null,
                talent: userMap.get(offer.talentId) ?? null,
            })),
        };
    };
}

const getGigOffersForGig = new GetGigOffersForGig(new GigRepository(), new GigOfferRepository(), new UserRepository());

export default getGigOffersForGig;
