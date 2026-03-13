import { ControllerArgs, HttpStatus } from '@/core';
import { AdminAuditLogsQueryDto } from '../../interfaces';
import { AdminRepository } from '../../repository';

export class GetAdminAuditLogs {
    constructor(private readonly adminRepository: AdminRepository) {}

    handle = async ({ query }: ControllerArgs<AdminAuditLogsQueryDto>) => {
        const auditLogs = await this.adminRepository.getAuditLogs(query ?? {});

        return {
            code: HttpStatus.OK,
            message: 'Audit Logs Retrieved Successfully',
            data: auditLogs,
        };
    };
}

const getAdminAuditLogs = new GetAdminAuditLogs(new AdminRepository());
export default getAdminAuditLogs;
