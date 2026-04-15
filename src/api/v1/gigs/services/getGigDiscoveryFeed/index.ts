import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError } from '@/core';
import { EmployerRepository } from '~/employers/repository';
import { GigOfferRepository, GigRepository, SavedGigRepository } from '~/gigs/repository';
import { TalentRepository } from '~/talents/repository';
import { UserRepository } from '~/user/repository';
import { GetGigDiscoveryFeedDto, Gig, GigApplication, GigOffer, ServiceCatalog, TalentGigItem } from '../../interfaces';

type DiscoveryGigCard = Gig & {
    distanceKm: number | null;
    employer: Record<string, unknown> | null;
    employerProfile: Record<string, unknown> | null;
    isSaved: boolean;
    service: ServiceCatalog | null;
};

const toTimestamp = (value: string | null | undefined) => (value ? new Date(value).getTime() : 0);

const normalizeWords = (value: string | null | undefined) =>
    value
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean) ?? [];

const haversineDistanceKm = (latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) => {
    const earthRadiusKm = 6371;
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const latitudeDelta = toRadians(latitudeB - latitudeA);
    const longitudeDelta = toRadians(longitudeB - longitudeA);
    const a =
        Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const matchesLocationText = (gig: Gig, city: string | null, country: string | null) => {
    const location = `${gig.locationName ?? ''}`.toLowerCase();

    if (!location) return false;

    const cityMatch = city ? location.includes(city.toLowerCase()) : false;
    const countryMatch = country ? location.includes(country.toLowerCase()) : false;

    return cityMatch || countryMatch;
};

const scoreGigForTalent = (
    gig: Gig,
    service: ServiceCatalog | null,
    talentTerms: string[],
    userCity: string | null,
    radiusKm: number | null,
    distanceKm: number | null,
) => {
    const searchableText = normalizeWords([gig.title, gig.description, service?.name, service?.category].filter(Boolean).join(' '));
    const termMatches = talentTerms.filter((term) => searchableText.includes(term)).length;
    const isFutureGig = toTimestamp(gig.gigDate) > Date.now();
    const budgetScore = Math.max(Math.min(Number(gig.budgetAmount ?? 0) / 1000, 20), 0);

    return (
        termMatches * 30 +
        (gig.isRemote ? 8 : 0) +
        (matchesLocationText(gig, userCity, null) ? 16 : 0) +
        (distanceKm !== null && radiusKm !== null && distanceKm <= radiusKm ? Math.max(20 - distanceKm / 5, 1) : 0) +
        (isFutureGig ? 10 : 0) +
        budgetScore
    );
};

const uniqueById = <T extends { id: string }>(items: T[]) => {
    const seen = new Set<string>();

    return items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

const byGigDateAsc = <T extends { gig: Gig | null }>(items: T[]) =>
    items.sort((left, right) => toTimestamp(left.gig?.gigDate) - toTimestamp(right.gig?.gigDate));

export class GetGigDiscoveryFeed {
    constructor(
        private readonly gigRepository: GigRepository,
        private readonly gigOfferRepository: GigOfferRepository,
        private readonly savedGigRepository: SavedGigRepository,
        private readonly talentRepository: TalentRepository,
        private readonly employerRepository: EmployerRepository,
        private readonly userRepository: UserRepository,
    ) {}

    private async buildGigCard(
        gig: Gig,
        options: {
            savedGigIds: Set<string>;
            catalogMap: Map<string, ServiceCatalog>;
            viewerLatitude: number | null;
            viewerLongitude: number | null;
            employerCache: Map<string, Record<string, unknown> | null>;
            employerProfileCache: Map<string, Record<string, unknown> | null>;
        },
    ): Promise<DiscoveryGigCard> {
        const { savedGigIds, catalogMap, viewerLatitude, viewerLongitude, employerCache, employerProfileCache } = options;

        if (!employerCache.has(gig.employerId)) {
            const employer = await this.userRepository.findById(gig.employerId);
            employerCache.set(gig.employerId, employer ? this.userRepository.mapToCamelCase(employer) : null);
        }

        if (!employerProfileCache.has(gig.employerId)) {
            employerProfileCache.set(gig.employerId, await this.employerRepository.findByUserId(gig.employerId));
        }

        const distanceKm =
            viewerLatitude !== null && viewerLongitude !== null && gig.locationLatitude !== null && gig.locationLongitude !== null
                ? Number(haversineDistanceKm(viewerLatitude, viewerLongitude, gig.locationLatitude, gig.locationLongitude).toFixed(1))
                : null;

        return {
            ...gig,
            distanceKm,
            employer: employerCache.get(gig.employerId) ?? null,
            employerProfile: employerProfileCache.get(gig.employerId) ?? null,
            isSaved: savedGigIds.has(gig.id),
            service: gig.serviceId ? catalogMap.get(gig.serviceId) ?? null : null,
        };
    }

    private buildOfferContext(
        offer: GigOffer,
        gigMap: Map<string, Gig>,
        employerMap: Map<string, Record<string, unknown> | null>,
        talentMap: Map<string, Record<string, unknown> | null>,
    ) {
        return {
            ...offer,
            gig: gigMap.get(offer.gigId) ?? null,
            employer: employerMap.get(offer.employerId) ?? null,
            talent: talentMap.get(offer.talentId) ?? null,
        };
    }

    handle = async ({ query, request }: ControllerArgs<GetGigDiscoveryFeedDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const limit = query.limit ?? query.pageSize ?? 6;

        const [userRow, talentProfile, catalog, openGigs, savedGigs, talentGigItems, receivedOffers] = await Promise.all([
            this.userRepository.findById(userId),
            this.talentRepository.findByUserId(userId),
            this.gigRepository.getCatalog(),
            this.gigRepository.getAllGigs({ status: 'open', page: 1, pageSize: 200 }),
            this.savedGigRepository.getSavedGigsForUser(userId, { page: 1, pageSize: 200 }),
            this.gigRepository.getTalentGigItems(userId, { page: 1, pageSize: 100 }),
            this.gigOfferRepository.getOffersForUser(userId, { direction: 'received', status: 'pending', page: 1, pageSize: 20 }),
        ]);

        if (!userRow) throw new RouteNotFoundError('User not found');

        const user = this.userRepository.mapToCamelCase(userRow);
        const savedGigIds = new Set(savedGigs.map((savedGig) => savedGig.gigId));
        const catalogMap = new Map(catalog.map((service) => [service.id, service]));
        const userLatitude = query.latitude ?? user.locationLatitude ?? null;
        const userLongitude = query.longitude ?? user.locationLongitude ?? null;
        const radiusKm = query.radiusKm ?? 50;
        const excludedGigIds = new Set(talentGigItems.map((item) => item.gig?.id).filter((gigId): gigId is string => Boolean(gigId)));

        const availableOpenGigs = openGigs.filter((gig) => !excludedGigIds.has(gig.id) && gig.employerId !== userId);
        const employerCache = new Map<string, Record<string, unknown> | null>();
        const employerProfileCache = new Map<string, Record<string, unknown> | null>();

        const talentTerms = uniqueById(
            normalizeWords(
                [talentProfile?.primaryRole, talentProfile?.stageName, ...(talentProfile?.skills ?? []).map(String)].filter(Boolean).join(' '),
            ).map((term, index) => ({ id: `${term}-${index}`, term })),
        ).map((item) => item.term);

        const scoredGigs = availableOpenGigs
            .map((gig) => {
                const service = gig.serviceId ? catalogMap.get(gig.serviceId) ?? null : null;
                const distanceKm =
                    userLatitude !== null && userLongitude !== null && gig.locationLatitude !== null && gig.locationLongitude !== null
                        ? haversineDistanceKm(userLatitude, userLongitude, gig.locationLatitude, gig.locationLongitude)
                        : null;

                return {
                    gig,
                    service,
                    distanceKm,
                    score: scoreGigForTalent(gig, service, talentTerms, user.locationCity, radiusKm, distanceKm),
                };
            })
            .sort((left, right) => right.score - left.score || toTimestamp(right.gig.createdAt) - toTimestamp(left.gig.createdAt));

        const nearYouSource = availableOpenGigs
            .filter((gig) => {
                if (gig.isRemote) return false;

                if (userLatitude !== null && userLongitude !== null && gig.locationLatitude !== null && gig.locationLongitude !== null) {
                    return haversineDistanceKm(userLatitude, userLongitude, gig.locationLatitude, gig.locationLongitude) <= radiusKm;
                }

                return matchesLocationText(gig, user.locationCity, user.locationCountry);
            })
            .sort((left, right) => toTimestamp(left.gigDate) - toTimestamp(right.gigDate));

        const nearYou = nearYouSource.slice(0, limit);
        const recommended = scoredGigs.filter((item) => item.score > 0 && !nearYou.some((gig) => gig.id === item.gig.id)).slice(0, limit);
        const gigsForYou = scoredGigs
            .filter(
                (item) =>
                    !nearYou.some((gig) => gig.id === item.gig.id) && !recommended.some((recommendedItem) => recommendedItem.gig.id === item.gig.id),
            )
            .slice(0, limit);

        const activeItems = talentGigItems.filter((item) => item.application.status === 'hired' && item.gig?.status === 'in_progress');
        const upcomingItems = byGigDateAsc(
            talentGigItems.filter(
                (item) =>
                    item.application.status === 'hired' &&
                    Boolean(item.gig) &&
                    item.gig?.status !== 'completed' &&
                    item.gig?.status !== 'cancelled' &&
                    toTimestamp(item.gig?.gigDate) > Date.now(),
            ),
        );

        const offerGigIds = receivedOffers.map((offer) => offer.gigId);
        const offerEmployerIds = receivedOffers.map((offer) => offer.employerId);
        const offerTalentIds = receivedOffers.map((offer) => offer.talentId);
        const [offerGigs, offerEmployers, offerTalents] = await Promise.all([
            this.gigRepository.getGigsByIds(offerGigIds),
            Promise.all(offerEmployerIds.map(async (id) => this.userRepository.findById(id))),
            Promise.all(offerTalentIds.map(async (id) => (id === userId ? userRow : this.userRepository.findById(id)))),
        ]);

        const offerGigMap = new Map(offerGigs.map((gig) => [gig.id, gig]));
        const offerEmployerMap = new Map(
            offerEmployerIds.map((id, index) => {
                const employer = offerEmployers[index];
                return [id, employer ? this.userRepository.mapToCamelCase(employer) : null];
            }),
        );
        const offerTalentMap = new Map(
            offerTalentIds.map((id, index) => {
                const talent = offerTalents[index];
                return [id, talent ? this.userRepository.mapToCamelCase(talent) : null];
            }),
        );

        const buildCards = async (gigs: Gig[]) =>
            Promise.all(
                gigs.map((gig) =>
                    this.buildGigCard(gig, {
                        savedGigIds,
                        catalogMap,
                        viewerLatitude: userLatitude,
                        viewerLongitude: userLongitude,
                        employerCache,
                        employerProfileCache,
                    }),
                ),
            );

        const [nearYouCards, recommendedCards, gigsForYouCards, activeCards, upcomingCards] = await Promise.all([
            buildCards(nearYou),
            buildCards(recommended.map((item) => item.gig)),
            buildCards(gigsForYou.map((item) => item.gig)),
            Promise.all(
                activeItems.slice(0, limit).map(async (item) => ({
                    application: item.application,
                    gig: item.gig
                        ? await this.buildGigCard(item.gig, {
                              savedGigIds,
                              catalogMap,
                              viewerLatitude: userLatitude,
                              viewerLongitude: userLongitude,
                              employerCache,
                              employerProfileCache,
                          })
                        : null,
                })),
            ),
            Promise.all(
                upcomingItems.slice(0, limit).map(async (item) => ({
                    application: item.application,
                    gig: item.gig
                        ? await this.buildGigCard(item.gig, {
                              savedGigIds,
                              catalogMap,
                              viewerLatitude: userLatitude,
                              viewerLongitude: userLongitude,
                              employerCache,
                              employerProfileCache,
                          })
                        : null,
                })),
            ),
        ]);

        return {
            code: HttpStatus.OK,
            message: 'Gig Discovery Feed Retrieved Successfully',
            data: {
                nearYou: nearYouCards,
                recommended: recommendedCards,
                gigsForYou: gigsForYouCards,
                active: activeCards as Array<{ application: GigApplication; gig: DiscoveryGigCard | null }>,
                upcoming: upcomingCards as Array<{ application: GigApplication; gig: DiscoveryGigCard | null }>,
                offers: receivedOffers.slice(0, limit).map((offer) => this.buildOfferContext(offer, offerGigMap, offerEmployerMap, offerTalentMap)),
            },
        };
    };
}

const getGigDiscoveryFeed = new GetGigDiscoveryFeed(
    new GigRepository(),
    new GigOfferRepository(),
    new SavedGigRepository(),
    new TalentRepository(),
    new EmployerRepository(),
    new UserRepository(),
);

export default getGigDiscoveryFeed;
