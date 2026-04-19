type MailLayoutOptions = {
    title: string;
    greetingName: string;
    contentHtml: string;
    supportEmail?: string;
};

type PasswordResetMailOptions = {
    firstName: string;
    resetUrl: string;
    supportEmail?: string;
};

type WelcomeOnboardingMailOptions = {
    firstName: string;
    supportEmail?: string;
};

type NewLoginActivityMailOptions = {
    firstName: string;
    device: string;
    location: string;
    time: string;
    resetUrl: string;
    supportEmail?: string;
};

type PaymentReleaseOtpMailOptions = {
    firstName: string;
    otpCode: string;
    gigTitle: string;
    amount: string;
    supportEmail?: string;
};

type NotificationMailOptions = {
    firstName: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    supportEmail?: string;
};

type WelcomeEmployerMailOptions = {
    firstName: string;
    supportEmail?: string;
};

type PaymentReceivedMailOptions = {
    firstName: string;
    gigTitle: string;
    amount: string;
    currency: string;
    supportEmail?: string;
};

type PaymentReleasedMailOptions = {
    firstName: string;
    gigTitle: string;
    amount: string;
    currency: string;
    withdrawUrl?: string;
    supportEmail?: string;
};

type PayoutRequestedMailOptions = {
    firstName: string;
    amount: string;
    currency: string;
    supportEmail?: string;
};

type PayoutPaidMailOptions = {
    firstName: string;
    amount: string;
    currency: string;
    externalTransferId: string;
    externalProvider: string;
    supportEmail?: string;
};

type DisputeOpenedMailOptions = {
    firstName: string;
    gigTitle: string;
    reason: string;
    supportEmail?: string;
};

type DisputeResolvedMailOptions = {
    firstName: string;
    gigTitle: string;
    resolution: 'resolved_talent' | 'resolved_employer' | 'withdrawn';
    supportEmail?: string;
};

const defaultSupportEmail = 'support@gigify.com';

const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const escapeAttribute = (value: string) => escapeHtml(value);

const renderButton = (label: string, href: string) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 32px;">
      <tr>
        <td bgcolor="#1145A7" style="border-radius: 4px; background-color: #1145A7;">
          <a
            href="${escapeAttribute(href)}"
            style="
              display: inline-block;
              padding: 12px 40px;
              color: #FFFFFF;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 14px;
              font-weight: 700;
              line-height: 17px;
              text-decoration: none;
            "
          >
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
`;

const renderLogo = (textColor: string) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
      <tr>
        <td style="padding-right: 10px;">
          <span
            style="
              display: inline-block;
              width: 30px;
              height: 30px;
              border: 2px solid ${textColor};
              border-radius: 999px;
              color: ${textColor};
              font-family: Arial, Helvetica, sans-serif;
              font-size: 18px;
              font-weight: 700;
              line-height: 26px;
              text-align: center;
            "
          >
            G
          </span>
        </td>
        <td style="
              color: ${textColor};
              font-family: Arial, Helvetica, sans-serif;
              font-size: 30px;
              font-weight: 700;
              letter-spacing: -0.02em;
              line-height: 1;
            ">
          TheGigify
        </td>
      </tr>
    </table>
`;

const renderSocialPill = (label: string) => `
    <td style="padding: 0 8px;">
      <span
        style="
          display: inline-block;
          min-width: 20px;
          height: 20px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 999px;
          color: #FFFFFF;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 18px;
          text-align: center;
          padding: 0 5px;
        "
      >
        ${escapeHtml(label)}
      </span>
    </td>
`;

const renderFooterLinks = (supportEmail: string) => {
    const mailtoSupport = `mailto:${supportEmail}?subject=${encodeURIComponent('Gigify support request')}`;
    const unsubscribeLink = `mailto:${supportEmail}?subject=${encodeURIComponent('Unsubscribe from Gigify emails')}`;

    return `
      <p style="margin: 0; color: #FFFFFF; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 16px; text-align: center;">
        You are receiving this mail because you registered to join the GIGIFY platform as a Talent.
        This also shows that you agree to our Terms of use and Privacy Policies. If you no longer want to
        receive mails from us, click the unsubscribe link below to unsubscribe.
      </p>
      <p style="margin: 14px 0 0; color: #FFFFFF; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 16px; text-align: center;">
        <span style="text-decoration: underline;">Privacy policy</span>
        <span style="padding: 0 8px;">&bull;</span>
        <span style="text-decoration: underline;">Terms of service</span>
        <span style="padding: 0 8px;">&bull;</span>
        <a href="${escapeAttribute(mailtoSupport)}" style="color: #FFFFFF; text-decoration: underline;">Help center</a>
        <span style="padding: 0 8px;">&bull;</span>
        <a href="${escapeAttribute(unsubscribeLink)}" style="color: #FFFFFF; text-decoration: underline;">Unsubscribe</a>
      </p>
    `;
};

const renderLayout = ({ title, greetingName, contentHtml, supportEmail }: MailLayoutOptions) => {
    const resolvedSupportEmail = supportEmail?.trim() || process.env.RESEND_FROM_ADDRESS?.trim() || defaultSupportEmail;

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; background-color: #FAFCFF; padding: 0;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAFCFF;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 600px; max-width: 100%; background-color: #FAFCFF;">
            <tr>
              <td
                style="
                  background-color: #0042B5;
                  background-image:
                    radial-gradient(circle at 15% 10%, rgba(255, 255, 255, 0.10) 0, rgba(255, 255, 255, 0.10) 18%, transparent 19%),
                    radial-gradient(circle at 70% 15%, rgba(255, 255, 255, 0.08) 0, rgba(255, 255, 255, 0.08) 20%, transparent 21%),
                    radial-gradient(circle at 40% 90%, rgba(255, 255, 255, 0.06) 0, rgba(255, 255, 255, 0.06) 16%, transparent 17%);
                  border-radius: 0 0 0 0;
                  padding: 24px 24px 20px;
                  text-align: center;
                "
              >
                ${renderLogo('#FAFCFF')}
              </td>
            </tr>
            <tr>
              <td style="padding: 32px; background-color: #FAFCFF;">
                <h1 style="margin: 0 0 14px; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; line-height: 32px; letter-spacing: -0.02em;">
                  ${escapeHtml(title)}
                </h1>
                <p style="margin: 0 0 12px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 700; line-height: 32px;">
                  Hello ${escapeHtml(greetingName)},
                </p>
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td
                style="
                  background-color: #0B0B0B;
                  background-image:
                    radial-gradient(circle at 12% 10%, rgba(255, 255, 255, 0.06) 0, rgba(255, 255, 255, 0.06) 15%, transparent 16%),
                    radial-gradient(circle at 70% 25%, rgba(255, 255, 255, 0.05) 0, rgba(255, 255, 255, 0.05) 18%, transparent 19%),
                    radial-gradient(circle at 30% 85%, rgba(255, 255, 255, 0.04) 0, rgba(255, 255, 255, 0.04) 20%, transparent 21%);
                  border-radius: 24px 24px 0 0;
                  padding: 40px 16px;
                "
              >
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      ${renderLogo('#FFFFFF')}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 16px; color: #FFFFFF; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 14px;">
                      Follow us on our social media pages and Stay updated
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                        <tr>
                          ${renderSocialPill('IG')}
                          ${renderSocialPill('TT')}
                          ${renderSocialPill('FB')}
                          ${renderSocialPill('X')}
                          ${renderSocialPill('YT')}
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid rgba(255, 255, 255, 0.75); padding-top: 16px; color: #FFFFFF; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 14px; text-align: center;">
                      © 2026 GIGIFY. All rights reserved.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 28px;">
                      ${renderFooterLinks(resolvedSupportEmail)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};

export const passwordResetMail = ({ firstName, resetUrl, supportEmail }: PasswordResetMailOptions) => {
    const contentHtml = `
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        We received a request to reset your Gigify password.
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If this was you, click the button below to create a new password:
      </p>
      ${renderButton('Reset Password', resetUrl)}
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        For security reasons, this link will expire in 30 minutes.
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If you didn’t request this change, you can safely ignore this email. Your account remains secure.
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Your security matters to us. Gigify uses secure authentication systems to protect your profile and bookings.
      </p>
      <p style="margin: 0 0 32px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If you continue to experience issues, contact our
        <a href="mailto:${escapeAttribute(
            supportEmail?.trim() || process.env.RESEND_FROM_ADDRESS?.trim() || defaultSupportEmail,
        )}?subject=${encodeURIComponent(
        'Gigify password reset support',
    )}" style="color: #005DFF; font-weight: 700; text-decoration: none;">support</a>
        team.
      </p>
      <p style="margin: 0; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Best Regards,
      </p>
      <p style="margin: 0; color: #0055E8; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; line-height: 22px;">
        The Gigify Team.
      </p>
    `;

    return renderLayout({
        title: 'Reset Your Gigify Password',
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const welcomeOnboardingMail = ({ firstName, supportEmail }: WelcomeOnboardingMailOptions) => {
    const contentHtml = `
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        You’re in. Your Gigify account is now active and ready for the next step.
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Complete your profile setup so we can connect you with the right gigs, help employers understand your style, and make it easier for opportunities to reach you faster.
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Once you finish onboarding, you’ll be ready to explore bookings, receive offers, and manage your work in one place.
      </p>
      <p style="margin: 0 0 32px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If you need help getting started, contact
        <a href="mailto:${escapeAttribute(
            supportEmail?.trim() || process.env.RESEND_FROM_ADDRESS?.trim() || defaultSupportEmail,
        )}?subject=${encodeURIComponent(
        'Gigify onboarding support',
    )}" style="color: #005DFF; font-weight: 700; text-decoration: none;">Gigify support</a>.
      </p>
      <p style="margin: 0; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Best Regards,
      </p>
      <p style="margin: 0; color: #0055E8; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; line-height: 22px;">
        The Gigify Team.
      </p>
    `;

    return renderLayout({
        title: 'You’re In! Let’s Get You Booked on Gigify',
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const newLoginActivityMail = ({ firstName, device, location, time, resetUrl, supportEmail }: NewLoginActivityMailOptions) => {
    const contentHtml = `
      <p style="margin: 0 0 16px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        We detected a new login attempt on your Gigify account.
      </p>
      <p style="margin: 0 0 16px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Here are the details:
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Device: ${escapeHtml(device)}<br />
        Location: ${escapeHtml(location)}<br />
        Time: ${escapeHtml(time)}
      </p>
      <p style="margin: 0 0 16px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If this was you, no further action is needed.
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If this wasn’t you, we recommend securing your account immediately:
      </p>
      ${renderButton('Reset Password', resetUrl)}
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Your safety and bookings matter to us. We continuously monitor suspicious activity to protect your account.
      </p>
      <p style="margin: 0 0 32px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If you need assistance, our
        <a href="mailto:${escapeAttribute(
            supportEmail?.trim() || process.env.RESEND_FROM_ADDRESS?.trim() || defaultSupportEmail,
        )}?subject=${encodeURIComponent(
        'Gigify login activity support',
    )}" style="color: #005DFF; font-weight: 700; text-decoration: none;">support</a>
        team is ready to help.
      </p>
      <p style="margin: 0; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Best Regards,
      </p>
      <p style="margin: 0; color: #0055E8; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; line-height: 22px;">
        The Gigify Team.
      </p>
    `;

    return renderLayout({
        title: 'New Login Attempt on Your Gigify Account',
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const paymentReleaseOtpMail = ({ firstName, otpCode, gigTitle, amount, supportEmail }: PaymentReleaseOtpMailOptions) => {
    const contentHtml = `
      <p style="margin: 0 0 16px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Use the verification code below to release escrow funds for <strong>${escapeHtml(gigTitle)}</strong>.
      </p>
      <p style="margin: 0 0 16px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Release amount: <strong>${escapeHtml(amount)}</strong>
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px;">
        <tr>
          <td style="border: 1px solid #D4D4D8; border-radius: 10px; background-color: #FFFFFF; padding: 16px 20px; color: #00338C; font-family: Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 700; letter-spacing: 0.3em;">
            ${escapeHtml(otpCode)}
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 16px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        This code expires in 10 minutes. If you didn't request this payment release, contact support immediately.
      </p>
      <p style="margin: 0 0 32px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If you need help, contact
        <a href="mailto:${escapeAttribute(
            supportEmail?.trim() || process.env.RESEND_FROM_ADDRESS?.trim() || defaultSupportEmail,
        )}?subject=${encodeURIComponent(
        'Gigify payment release verification support',
    )}" style="color: #005DFF; font-weight: 700; text-decoration: none;">Gigify support</a>.
      </p>
      <p style="margin: 0; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Best Regards,
      </p>
      <p style="margin: 0; color: #0055E8; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; line-height: 22px;">
        The Gigify Team.
      </p>
    `;

    return renderLayout({
        title: 'Verify Your Gigify Payment Release',
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const notificationMail = ({ firstName, title, message, actionUrl, actionLabel, supportEmail }: NotificationMailOptions) => {
    let contentHtml = `
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        ${escapeHtml(message)}
      </p>
    `;

    if (actionUrl && actionLabel) {
        contentHtml += renderButton(actionLabel, actionUrl);
    }

    contentHtml += `
      <p style="margin: 0 0 32px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If you need help, contact
        <a href="mailto:${escapeAttribute(
            supportEmail?.trim() || process.env.RESEND_FROM_ADDRESS?.trim() || defaultSupportEmail,
        )}?subject=${encodeURIComponent('Gigify support')}" style="color: #005DFF; font-weight: 700; text-decoration: none;">Gigify support</a>.
      </p>
      <p style="margin: 0; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Best Regards,
      </p>
      <p style="margin: 0; color: #0055E8; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; line-height: 22px;">
        The Gigify Team.
      </p>
    `;

    return renderLayout({
        title,
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

const paragraph = (text: string) =>
    `<p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">${text}</p>`;

const signoff = `
      <p style="margin: 0; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">Best Regards,</p>
      <p style="margin: 0; color: #0055E8; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; line-height: 22px;">The Gigify Team.</p>`;

export const paymentReceivedMail = ({ firstName, gigTitle, amount, currency, supportEmail }: PaymentReceivedMailOptions) => {
    const contentHtml = `
      ${paragraph(`Great news — the employer has funded escrow for <strong>${escapeHtml(gigTitle)}</strong>.`)}
      ${paragraph(`<strong>${escapeHtml(currency)} ${escapeHtml(amount)}</strong> is now safely held on Gigify until the gig is complete.`)}
      ${paragraph(
          `We’ll release the funds to you as soon as the employer confirms the work is done, so you can request a payout from your earnings dashboard.`,
      )}
      ${signoff}
    `;

    return renderLayout({
        title: `Funds secured in escrow for ${gigTitle}`,
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const paymentReleasedMail = ({ firstName, gigTitle, amount, currency, withdrawUrl, supportEmail }: PaymentReleasedMailOptions) => {
    const contentHtml = `
      ${paragraph(`The employer has released payment for <strong>${escapeHtml(gigTitle)}</strong>.`)}
      ${paragraph(`<strong>${escapeHtml(currency)} ${escapeHtml(amount)}</strong> is now available in your Gigify earnings — ready to withdraw.`)}
      ${withdrawUrl ? renderButton('Request a payout', withdrawUrl) : ''}
      ${paragraph(`Thanks for delivering great work on this booking.`)}
      ${signoff}
    `;

    return renderLayout({
        title: `${currency} ${amount} released, ready to withdraw`,
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const payoutRequestedMail = ({ firstName, amount, currency, supportEmail }: PayoutRequestedMailOptions) => {
    const contentHtml = `
      ${paragraph(`We’ve received your payout request for <strong>${escapeHtml(currency)} ${escapeHtml(amount)}</strong>.`)}
      ${paragraph(
          `Our finance team will review it and move the funds to your default payout method. You’ll get another email the moment the transfer goes out.`,
      )}
      ${signoff}
    `;

    return renderLayout({
        title: 'Payout request received',
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const payoutPaidMail = ({ firstName, amount, currency, externalTransferId, externalProvider, supportEmail }: PayoutPaidMailOptions) => {
    const contentHtml = `
      ${paragraph(`Your payout of <strong>${escapeHtml(currency)} ${escapeHtml(amount)}</strong> has been sent.`)}
      ${paragraph(
          `Transfer reference: <code>${escapeHtml(externalTransferId)}</code> via ${escapeHtml(
              externalProvider,
          )}. Save this reference in case your bank asks for it.`,
      )}
      ${paragraph(`Funds typically settle within 1–3 business days depending on your provider.`)}
      ${signoff}
    `;

    return renderLayout({
        title: `Payout of ${currency} ${amount} sent`,
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const disputeOpenedMail = ({ firstName, gigTitle, reason, supportEmail }: DisputeOpenedMailOptions) => {
    const contentHtml = `
      ${paragraph(`A dispute has been opened on <strong>${escapeHtml(gigTitle)}</strong>.`)}
      ${paragraph(`Reason: <em>${escapeHtml(reason)}</em>.`)}
      ${paragraph(`Payment release is on hold until our team reviews the case. You can upload supporting evidence from your Gigify dashboard.`)}
      ${signoff}
    `;

    return renderLayout({
        title: `Dispute opened on ${gigTitle}`,
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const disputeResolvedMail = ({ firstName, gigTitle, resolution, supportEmail }: DisputeResolvedMailOptions) => {
    const outcomeCopy = {
        resolved_talent: 'Our team ruled in the talent’s favour; funds have been released.',
        resolved_employer: 'Our team ruled in the employer’s favour; funds were returned.',
        withdrawn: 'The dispute was withdrawn and the gig is back on its normal track.',
    }[resolution];

    const contentHtml = `
      ${paragraph(`The dispute on <strong>${escapeHtml(gigTitle)}</strong> has been resolved.`)}
      ${paragraph(`Outcome: <strong>${escapeHtml(outcomeCopy)}</strong>`)}
      ${paragraph(`If you have any questions about this decision, reply to this email and our team will follow up.`)}
      ${signoff}
    `;

    return renderLayout({
        title: `Dispute on ${gigTitle} resolved`,
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};

export const welcomeEmployerMail = ({ firstName, supportEmail }: WelcomeEmployerMailOptions) => {
    const contentHtml = `
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Your Gigify employer account is now active and ready to start posting gigs.
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Post your first gig and connect with skilled talent. Set your budget, timeline, and requirements to attract the right professionals for your project.
      </p>
      <p style="margin: 0 0 22px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Once you've posted a gig, you can start managing applications, communicating with talent, and booking the best fit for your needs.
      </p>
      <p style="margin: 0 0 32px; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        If you need help getting started, contact
        <a href="mailto:${escapeAttribute(
            supportEmail?.trim() || process.env.RESEND_FROM_ADDRESS?.trim() || defaultSupportEmail,
        )}?subject=${encodeURIComponent(
        'Gigify employer support',
    )}" style="color: #005DFF; font-weight: 700; text-decoration: none;">Gigify support</a>.
      </p>
      <p style="margin: 0; color: #333333; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
        Best Regards,
      </p>
      <p style="margin: 0; color: #0055E8; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; line-height: 22px;">
        The Gigify Team.
      </p>
    `;

    return renderLayout({
        title: 'Welcome to Gigify — Start Posting Gigs',
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};
