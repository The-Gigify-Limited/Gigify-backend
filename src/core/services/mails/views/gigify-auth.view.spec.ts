import {
    disputeOpenedMail,
    disputeResolvedMail,
    newLoginActivityMail,
    passwordResetMail,
    paymentReceivedMail,
    paymentReleaseOtpMail,
    paymentReleasedMail,
    payoutPaidMail,
    payoutRequestedMail,
    welcomeOnboardingMail,
} from './gigify-auth.view';

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

    it('renders the welcome onboarding email content from the Figma flow', () => {
        const html = welcomeOnboardingMail({
            firstName: 'Ada',
            supportEmail: 'support@gigify.com',
        });

        expect(html).toContain('You’re In! Let’s Get You Booked on Gigify');
        expect(html).toContain('Hello Ada,');
        expect(html).toContain('Complete your profile setup');
        expect(html).toContain('Gigify support');
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

    it('renders the payment received (escrow funded) email', () => {
        const html = paymentReceivedMail({
            firstName: 'Ada',
            gigTitle: 'Afrobeat Rooftop Set',
            amount: '180,000.00',
            currency: 'NGN',
        });

        expect(html).toContain('Funds secured in escrow for Afrobeat Rooftop Set');
        expect(html).toContain('Hello Ada,');
        expect(html).toContain('NGN');
        expect(html).toContain('180,000.00');
    });

    it('renders the payment released email with the withdraw CTA when a URL is supplied', () => {
        const html = paymentReleasedMail({
            firstName: 'Ada',
            gigTitle: 'Afrobeat Rooftop Set',
            amount: '180,000.00',
            currency: 'NGN',
            withdrawUrl: 'https://app.gigify.com/earnings',
        });

        expect(html).toContain('NGN 180,000.00 released');
        expect(html).toContain('Request a payout');
        expect(html).toContain('https://app.gigify.com/earnings');
    });

    it('renders the payout requested confirmation email', () => {
        const html = payoutRequestedMail({
            firstName: 'Ada',
            amount: '90,000.00',
            currency: 'NGN',
        });

        expect(html).toContain('Payout request received');
        expect(html).toContain('NGN');
        expect(html).toContain('90,000.00');
    });

    it('renders the payout paid email with the external transfer reference', () => {
        const html = payoutPaidMail({
            firstName: 'Ada',
            amount: '90,000.00',
            currency: 'NGN',
            externalTransferId: 'txn_abc_xyz',
            externalProvider: 'stripe',
        });

        expect(html).toContain('Payout of NGN 90,000.00 sent');
        expect(html).toContain('txn_abc_xyz');
        expect(html).toContain('stripe');
    });

    it('renders the dispute opened email with the reason and gig title', () => {
        const html = disputeOpenedMail({
            firstName: 'Ada',
            gigTitle: 'Afrobeat Rooftop Set',
            reason: 'Service not delivered',
        });

        expect(html).toContain('Dispute opened on Afrobeat Rooftop Set');
        expect(html).toContain('Service not delivered');
        expect(html).toContain('Payment release is on hold');
    });

    it('renders the dispute resolved email with the resolution copy', () => {
        const html = disputeResolvedMail({
            firstName: 'Ada',
            gigTitle: 'Afrobeat Rooftop Set',
            resolution: 'resolved_talent',
        });

        expect(html).toContain('Dispute on Afrobeat Rooftop Set resolved');
        expect(html).toContain('ruled in the talent');
    });

    it('escapes user-provided strings in payment and dispute emails', () => {
        const html = paymentReceivedMail({
            firstName: 'Ada',
            gigTitle: '<script>alert(1)</script>',
            amount: '100.00',
            currency: 'NGN',
        });

        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).not.toContain('<script>alert(1)</script>');
    });
});
