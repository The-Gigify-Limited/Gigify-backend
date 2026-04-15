import { Gig } from './interfaces';
import { GigRepository, ReportRepository } from './repository';

export async function getGigByIdEventListener(gigId: string): Promise<Gig | null> {
    const gigRepository = new GigRepository();
    const gig = await gigRepository.getGigById(gigId);
    return gig;
}

export async function getAllGigsEventListener(query: Record<string, any>): Promise<Gig[]> {
    const gigRepository = new GigRepository();
    const gigs = await gigRepository.getAllGigs(query);
    return gigs;
}

export async function updateGigReportStatusEventListener(input: {
    reportId: string;
    status: 'open' | 'in_review' | 'resolved' | 'dismissed';
}): Promise<any> {
    const reportRepository = new ReportRepository();
    const report = await reportRepository.updateReportById(input.reportId, { status: input.status });
    return report;
}

export async function findApplicationByGigAndTalentEventListener(input: { gigId: string; talentId: string }): Promise<any | null> {
    const gigRepository = new GigRepository();
    const application = await gigRepository.findApplicationByGigAndTalent(input.gigId, input.talentId);
    return application;
}
