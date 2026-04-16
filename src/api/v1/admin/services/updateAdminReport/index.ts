import { ControllerArgs, HttpStatus, RouteNotFoundError, UnAuthorizedError, auditService } from '@/core';
import { ReportRepository } from '~/gigs/repository';
import { AdminReportUpdateDto } from '../../interfaces';
import { notificationDispatcher } from '~/notifications/utils/dispatchNotification';

export class UpdateAdminReport {
    constructor(private readonly reportRepository: ReportRepository) {}

    handle = async ({ params, input, request }: ControllerArgs<AdminReportUpdateDto>) => {
        const adminId = request.user?.id;

        if (!adminId) throw new UnAuthorizedError('User not authenticated');

        const report = await this.reportRepository.getReportById(params.id);

        if (!report) throw new RouteNotFoundError('Report not found');

        const updatedReport = await this.reportRepository.updateReportById(report.id, {
            status: input.status,
            resolutionNote: input.resolutionNote ?? null,
            reviewedBy: adminId,
            reviewedAt: new Date().toISOString(),
        });

        await Promise.all([
            auditService.log({
                userId: adminId,
                action: 'admin_report_updated',
                resourceType: 'report',
                resourceId: updatedReport.id,
                changes: {
                    status: input.status,
                    resolutionNote: input.resolutionNote ?? null,
                },
                ipAddress: request.ip ?? null,
                userAgent: Array.isArray(request.headers['user-agent'])
                    ? request.headers['user-agent'][0] ?? null
                    : request.headers['user-agent'] ?? null,
            }),
            notificationDispatcher.dispatch({
                userId: updatedReport.reporterId,
                type: 'security_alert',
                title: 'Your report has been reviewed',
                message: `A Gigify administrator marked your report as ${input.status.replace('_', ' ')}.`,
                payload: {
                    reportId: updatedReport.id,
                    status: input.status,
                },
                preferenceKey: 'securityAlerts',
            }),
        ]);

        return {
            code: HttpStatus.OK,
            message: 'Report Updated Successfully',
            data: updatedReport,
        };
    };
}

const updateAdminReport = new UpdateAdminReport(new ReportRepository());
export default updateAdminReport;
