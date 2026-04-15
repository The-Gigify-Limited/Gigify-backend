import { ConflictError, ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { dispatch } from '@/app';
import { ReportTalentDto } from '../../interfaces';
import { GigRepository, ReportRepository } from '../../repository';

export class ReportTalent {
    constructor(private readonly gigRepository: GigRepository, private readonly reportRepository: ReportRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<ReportTalentDto>) => {
        const employer = request.user;

        if (!employer?.id) throw new UnAuthorizedError('User not authenticated');

        const gig = await this.gigRepository.getGigById(params.id);

        if (!gig) throw new RouteNotFoundError('Gig not found');
        if (gig.employerId !== employer.id) throw new ConflictError('You do not own this gig');
        if (input.talentId === employer.id) throw new ConflictError('You cannot report yourself');

        const [applicationResults] = await dispatch('gig:find-application', { gigId: params.id, talentId: input.talentId });
        const application = applicationResults;

        if (!application || application.status !== 'hired') {
            throw new ConflictError('Only the selected talent for this gig can be reported from this screen');
        }

        const existingReport = await this.reportRepository.findOpenReport({
            gigId: params.id,
            reporterId: employer.id,
            reportedUserId: input.talentId,
        });

        if (existingReport) {
            throw new ConflictError('An active report already exists for this talent on this gig');
        }

        const report = await this.reportRepository.createReport({
            gigId: params.id,
            reporterId: employer.id,
            reportedUserId: input.talentId,
            category: input.category ?? null,
            reason: input.reason.trim(),
        });

        const activitiesList = [
            auditService.log({
                userId: employer.id,
                action: 'talent_report_submitted',
                resourceType: 'report',
                resourceId: report.id,
                changes: {
                    gigId: params.id,
                    reportedUserId: input.talentId,
                    category: input.category ?? null,
                },
                ipAddress: request.ip ?? null,
                userAgent: request.headers['user-agent'] ?? null,
            }),
        ];

        await Promise.all(activitiesList);

        return {
            code: HttpStatus.CREATED,
            message: 'Talent Report Submitted Successfully',
            data: report,
        };
    };
}

const reportTalent = new ReportTalent(new GigRepository(), new ReportRepository());
export default reportTalent;
