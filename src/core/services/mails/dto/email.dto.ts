export interface SendEmailRequestInterface {
    to: string;
    subject: string;
    body: string;
}

export type SendMailHandler = (emailDto: SendEmailRequestInterface) => Promise<{
    code: 200;
    data: any;
    message: string;
}>;

export interface SendVerificationMail {
    otp: number;
    email: string;
    fullName: string;
    subject: string;
}
