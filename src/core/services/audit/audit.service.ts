import { Json } from '@/core/types';
import { supabaseAdmin } from '@/core/config';

export type AuditLogInput = {
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    changes?: Json | null;
    result?: 'success' | 'failure';
    ipAddress?: string | null;
    userAgent?: string | null;
    errorMessage?: string | null;
};

export class AuditService {
    async log(input: AuditLogInput) {
        const { error } = await supabaseAdmin.from('audit_logs').insert({
            user_id: input.userId,
            action: input.action,
            resource_type: input.resourceType,
            resource_id: input.resourceId,
            changes: input.changes ?? null,
            result: input.result ?? 'success',
            ip_address: input.ipAddress ?? null,
            user_agent: input.userAgent ?? null,
            error_message: input.errorMessage ?? null,
        });

        if (error) throw error;
    }
}

export const auditService = new AuditService();
