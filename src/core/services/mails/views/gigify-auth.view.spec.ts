import { newLoginActivityMail, passwordResetMail, paymentReleaseOtpMail } from './gigify-auth.view';

describe('Gigify auth mail views', () => {
    it('renders the password reset email content from the Figma flow', () => {
        const html = passwordResetMail({
            firstName: 'Ada',
            resetUrl: 'https://example.com/reset?token=abc123',
            supportEmail: 'support@gigify.com',
        });

        expect(html).toContain('Reset Your Gigify Password');
        expect(html).toContain('Hello Ada,');
        expect(html).toContain('https://example.com/reset?token=abc123');
        expect(html).toContain('For security reasons, this link will expire in 30 minutes.');
        expect(html).toContain('The Gigify Team.');
    });

    it('escapes dynamic login metadata before rendering the login activity email', () => {
        const html = newLoginActivityMail({
            firstName: 'Ada',
            device: '<script>alert(1)</script>',
            location: 'Lagos & Abuja',
            time: 'Mar 12, 2026, 10:00 PM UTC',
            resetUrl: 'https://example.com/reset',
            supportEmail: 'support@gigify.com',
        });

        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).toContain('Lagos &amp; Abuja');
        expect(html).toContain('New Login Attempt on Your Gigify Account');
    });

    it('renders the payment release OTP mail with the verification code and booking context', () => {
        const html = paymentReleaseOtpMail({
            firstName: 'Ada',
            otpCode: '123456',
            gigTitle: 'Wedding of Mike and Sarah #MS2025',
            amount: 'NGN 200000',
            supportEmail: 'support@gigify.com',
        });

        expect(html).toContain('Verify Your Gigify Payment Release');
        expect(html).toContain('123456');
        expect(html).toContain('Wedding of Mike and Sarah #MS2025');
        expect(html).toContain('NGN 200000');
    });
});
