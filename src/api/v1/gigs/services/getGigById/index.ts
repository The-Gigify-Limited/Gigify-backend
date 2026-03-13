import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { EmployerRepository } from '~/employers/repository';
import { UserRepository } from '~/user/repository';
import { GetGigParamsDto } from '~/gigs/interfaces';
import { GigOfferRepository, GigRepository, SavedGigRepository } from '~/gigs/repository';

export class GetGigById {
    constructor(
        private readonly gigRepository: GigRepository,
        private readonly employerRepository: EmployerRepository,
        private readonly userRepository: UserRepository,
        private readonly savedGigRepository: SavedGigRepository,
        private readonly gigOfferRepository: GigOfferRepository,
    ) {}

    handle = async ({ params, request }: ControllerArgs<GetGigParamsDto>) => {
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');

        const [service, employer, employerProfile, myApplication, selectedApplications, savedGig, myOffer] = await Promise.all([
            gig.serviceId ? this.gigRepository.getServiceById(gig.serviceId) : Promise.resolve(null),
            this.userRepository.findById(gig.employerId),
            this.employerRepository.findByUserId(gig.employerId),
            request.user?.id ? this.gigRepository.findApplicationByGigAndTalent(gig.id, request.user.id) : Promise.resolve(null),
            this.gigRepository.getApplicationsForGig(gig.id, {
                page: 1,
                pageSize: Math.max(gig.requiredTalentCount ?? 1, 25),
                status: 'hired',
            }),
            request.user?.id ? this.savedGigRepository.findByUserAndGig(request.user.id, gig.id) : Promise.resolve(null),
            request.user?.id ? this.gigOfferRepository.findLatestOfferForGigAndTalent(gig.id, request.user.id) : Promise.resolve(null),
        ]);

        const selectedTalents = await Promise.all(
            selectedApplications.map(async (application) => {
                const talentRow = await this.userRepository.findById(application.talentId);

                return {
                    application,
                    talent: talentRow ? this.userRepository.mapToCamelCase(talentRow) : null,
                };
            }),
        );

        return {
            code: HttpStatus.OK,
            message: 'Gig Retrieved Successfully',
            data: {
                ...gig,
                service,
                employer: employer ? this.userRepository.mapToCamelCase(employer) : null,
                employerProfile,
                myApplication,
                selectedTalents,
                remainingTalentSlots: Math.max((gig.requiredTalentCount ?? 1) - selectedApplications.length, 0),
                isSaved: Boolean(savedGig),
                myOffer,
            },
        };
    };
}

const getGigById = new GetGigById(new GigRepository(), new EmployerRepository(), new UserRepository(), new SavedGigRepository(), new GigOfferRepository());

export default getGigById;
