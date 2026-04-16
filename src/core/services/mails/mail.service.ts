// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Resend } = require('resend') as { Resend: new (key: string) => ResendClient };
import { type SendEmailRequestInterface } from './dto';
import { config, logger } from '@/core';

interface ResendClient {
    emails: {
        send(params: { from: string; to: string; subject: string; html: string }): Promise<{ data: unknown; error: Error | null }>;
    };
}

const resend: ResendClient = new Resend(config.mail.apiKey);

export const sendEmail = async (emailDto: SendEmailRequestInterface) => {
    const { to, subject, body } = emailDto;

    const { error } = await resend.emails.send({
        from: config.mail.fromAddress,
        to,
        subject,
        html: body,
    });

    if (error) throw error;

    logger.info(`Mail sent successfully to ${to}`);

    return emailDto;
};
