import { dispatch } from '@/app';
import { HttpStatus, logger } from '@/core';
import { GigRepository } from '~/gigs/repository';

export class ExpireStaleGigs {
    constructor(private readonly gigRepository: GigRepository) {}

    handle = async () => {
        const staleGigs = await this.gigRepository.findStaleOpenGigs();

        if (staleGigs.length === 0) {
            return {
                code: HttpStatus.OK,
                message: 'No stale gigs to expire',
                data: { expiredCount: 0, gigIds: [] as string[] },
            };
        }

        const gigIds = staleGigs.map((gig) => gig.id);
        await this.gigRepository.markGigsExpired(gigIds);

        await Promise.all(
            staleGigs.map((gig) =>
                dispatch('gig:expired', {
                    gigId: gig.id,
                    employerId: gig.employerId,
                }),
            ),
        );

        logger.info('Expired stale gigs', {
            expiredCount: staleGigs.length,
            gigIds,
        });

        return {
            code: HttpStatus.OK,
            message: `Expired ${staleGigs.length} gig(s)`,
            data: { expiredCount: staleGigs.length, gigIds },
        };
    };
}

const expireStaleGigs = new ExpireStaleGigs(new GigRepository());

export default expireStaleGigs;
