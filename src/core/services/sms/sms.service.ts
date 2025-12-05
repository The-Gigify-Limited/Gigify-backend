import { BadRequestError, HttpStatus, config, logger } from '@/core';
import twilio, { Twilio } from 'twilio';
import { SendSms } from './dto';

class SMSService {
    twilio_client: Twilio | null = null;

    private create_twilio_client() {
        const client = twilio(config.twilio.twilio_sid, config.twilio.twilio_auth_token);

        logger.info('Twilio Client has been Initialized');

        this.twilio_client = client;
    }

    sendMessages = async (data: SendSms) => {
        this.create_twilio_client();

        if (!this.twilio_client) {
            throw new BadRequestError('Twilio Client has not been initialized');
        }

        const response = await this.twilio_client.messages.create({
            from: config.twilio.twilio_phone_number,
            body: data.body,
            to: data.phoneNumber,
        });

        logger.info(`SMS Sent Successfully, ${JSON.stringify(response)}`);

        return {
            code: HttpStatus.OK,
            data: response,
            message: 'SMS Sent Successfully',
        };
    };
}

export const sendSMS = new SMSService().sendMessages;
