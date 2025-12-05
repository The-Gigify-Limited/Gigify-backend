import { createTransport } from 'nodemailer';
import sendgridTransport from 'nodemailer-sendgrid';
import { type SendEmailRequestInterface } from './dto';
import { config, logger } from '@/core';

export const getTransporter = () => {
    const options = {
        apiKey: config.sendGrid.sendGridApikey,
    };

    return createTransport(sendgridTransport(options));
};

export const sendEmail = async (emailDto: SendEmailRequestInterface) => {
    const { to, subject, body } = emailDto;
    const from = config.sendGrid.sendgrid_email;

    const transporter = getTransporter();

    const mailOptions = {
        from,
        to,
        subject,
        html: body,
    };

    await transporter.sendMail(mailOptions);

    logger.info(`Mail sent Successfully to ${to}`);

    return emailDto;
};
