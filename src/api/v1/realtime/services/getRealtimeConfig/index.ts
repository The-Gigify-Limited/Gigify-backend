import { ControllerArgs, HttpStatus, UnAuthorizedError, config } from '@/core';

export class GetRealtimeConfig {
    handle = async ({ request }: ControllerArgs) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        return {
            code: HttpStatus.OK,
            message: 'Realtime Configuration Retrieved Successfully',
            data: {
                supabaseUrl: config.db.supabaseUrl,
                supabaseAnonKey: config.db.supabaseAnonKey,
            },
        };
    };
}

const getRealtimeConfig = new GetRealtimeConfig();
export default getRealtimeConfig;
