import { BadRequestError, ControllerArgs, HttpStatus, RouteNotFoundError } from '@/core';
import { dispatch } from '@/app';
import { GetGigParamsDto } from '~/gigs/interfaces';
import { GigOfferRepository, GigRepository, SavedGigRepository } from '~/gigs/repository';

export class GetGigById {
    constructor(
        private readonly gigRepository: GigRepository,
        private readonly savedGigRepository: SavedGigRepository,
        private readonly gigOfferRepository: GigOfferRepository,
    ) {}

    handle = async ({ params, request }: ControllerArgs<GetGigParamsDto>) => {
        if (!params?.id) throw new BadRequestError('Gig ID is required');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');

        const [serviceResult, employerResults, employerProfileResults, myApplication, selectedApplications, allApplications, savedGig, myOffer] =
            await Promise.all([
                gig.serviceId ? this.gigRepository.getServiceById(gig.serviceId) : Promise.resolve(null),
                dispatch('user:get-by-id', { id: gig.employerId }),
                dispatch('employer:get-profile', { user_id: gig.employerId }),
                request.user?.id ? dispatch('gig:find-application', { gigId: gig.id, talentId: request.user.id }) : Promise.resolve(null),
                this.gigRepository.getApplicationsForGig(gig.id, {
                    page: 1,
                    pageSize: Math.max(gig.requiredTalentCount ?? 1, 25),
                    status: 'hired',
                }),
                this.gigRepository.getApplicationsForGig(gig.id, {
                    page: 1,
                    pageSize: 100,
                }),
                request.user?.id ? this.savedGigRepository.findByUserAndGig(request.user.id, gig.id) : Promise.resolve(null),
                request.user?.id ? this.gigOfferRepository.findLatestOfferForGigAndTalent(gig.id, request.user.id) : Promise.resolve(null),
            ]);

        const employer = employerResults[0];
        const employerProfile = employerProfileResults[0];
        const myApp = myApplication ? myApplication[0] : null;

        const gigHire = await Promise.all(
            selectedApplications.map(async (application) => {
                const [talentResults] = await dispatch('user:get-by-id', { id: application.talentId });

                return {
                    application,
                    talent: talentResults ?? null,
                };
            }),
        );

        const gigApplicants = await Promise.all(
            allApplications.map(async (application) => {
                const [talentResults] = await dispatch('user:get-by-id', { id: application.talentId });

                return {
                    application,
                    talent: talentResults ?? null,
                };
            }),
        );

        return {
            code: HttpStatus.OK,
            message: 'Gig Retrieved Successfully',
            data: {
                ...gig,
                service: serviceResult,
                employer: employer ?? null,
                employerProfile: employerProfile ?? null,
                myApplication: myApp,
                gigHire,
                gigApplicants,
                remainingTalentSlots: Math.max((gig.requiredTalentCount ?? 1) - selectedApplications.length, 0),
                isSaved: Boolean(savedGig),
                myOffer,
            },
        };
    };
}

const getGigById = new GetGigById(new GigRepository(), new SavedGigRepository(), new GigOfferRepository());

export default getGigById;
