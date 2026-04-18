import { logger } from '@/core';
import { Gig, GigApplication, GigReport } from './interfaces';
import { GigRepository, ReportRepository } from './repository';

export async function getGigByIdEventListener(gigId: string): Promise<Gig | null> {
    const gigRepository = new GigRepository();
    const gig = await gigRepository.getGigById(gigId);
    return gig;
}

export async function getAllGigsEventListener(query: Record<string, string | number | boolean>): Promise<Gig[]> {
    const gigRepository = new GigRepository();
    const gigs = await gigRepository.getAllGigs(query);
    return gigs;
}

export async function updateGigReportStatusEventListener(input: {
    reportId: string;
    status: 'open' | 'in_review' | 'resolved' | 'dismissed';
}): Promise<GigReport> {
    const reportRepository = new ReportRepository();
    const report = await reportRepository.updateReportById(input.reportId, { status: input.status });
    return report;
}

export async function findApplicationByGigAndTalentEventListener(input: { gigId: string; talentId: string }): Promise<GigApplication | null> {
    const gigRepository = new GigRepository();
    const application = await gigRepository.findApplicationByGigAndTalent(input.gigId, input.talentId);
    return application;
}

export function applicationShortlistedEventListener(input: { gigId: string; applicationId: string; talentId: string; employerId: string }): void {
    logger.info('Gig application shortlisted', input);
}

export function applicationRejectedEventListener(input: { gigId: string; applicationId: string; talentId: string; employerId: string }): void {
    logger.info('Gig application rejected', input);
}
export function gigExpiredEventListener(input: { gigId: string; employerId: string }): void {
    logger.info('Gig expired', {
        gigId: input.gigId,
        employerId: input.employerId,
    });
}
