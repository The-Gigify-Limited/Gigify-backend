import { ControllerArgs, HttpStatus } from '@/core';
import { GigRepository, ReportRepository } from '~/gigs/repository';
import { UserRepository } from '~/user/repository';
import { AdminReportsQueryDto } from '../../interfaces';

export class GetAdminReports {
    constructor(
        private readonly reportRepository: ReportRepository,
        private readonly userRepository: UserRepository,
        private readonly gigRepository: GigRepository,
    ) {}

    handle = async ({ query }: ControllerArgs<AdminReportsQueryDto>) => {
        const reports = await this.reportRepository.getReports(query ?? {});
        const reporterIds = Array.from(new Set(reports.map((report) => report.reporterId)));
        const reportedUserIds = Array.from(new Set(reports.map((report) => report.reportedUserId)));
        const gigIds = Array.from(new Set(reports.map((report) => report.gigId).filter(Boolean))) as string[];

        const [reporters, reportedUsers, gigs] = await Promise.all([
            Promise.all(reporterIds.map((id) => this.userRepository.findById(id))),
            Promise.all(reportedUserIds.map((id) => this.userRepository.findById(id))),
            Promise.all(gigIds.map((id) => this.gigRepository.getGigById(id))),
        ]);

        const reporterMap = new Map(reporters.filter(Boolean).map((user) => [user!.id, this.userRepository.mapToCamelCase(user!)]));
        const reportedUserMap = new Map(reportedUsers.filter(Boolean).map((user) => [user!.id, this.userRepository.mapToCamelCase(user!)]));
        const gigMap = new Map(gigs.filter(Boolean).map((gig) => [gig!.id, gig!]));

        return {
            code: HttpStatus.OK,
            message: 'Admin Reports Retrieved Successfully',
            data: reports.map((report) => ({
                ...report,
                reporter: reporterMap.get(report.reporterId) ?? null,
                reportedUser: reportedUserMap.get(report.reportedUserId) ?? null,
                gig: report.gigId ? gigMap.get(report.gigId) ?? null : null,
            })),
        };
    };
}

const getAdminReports = new GetAdminReports(new ReportRepository(), new UserRepository(), new GigRepository());
export default getAdminReports;
