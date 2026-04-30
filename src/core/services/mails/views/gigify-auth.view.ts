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

// Brand assets are hosted alongside the marketing site at thegigify.com so
// they're cached, CDN-served, and inboxes don't strip them as inline blobs.
// Mirrors the assets used by the FE's react-email templates (frontend/app/
// email/), keeping both senders visually identical for users.
const BRAND = {
    siteUrl: 'https://www.thegigify.com',
    logoUrl: 'https://www.thegigify.com/email/LogoWhite.png',
    headerBgUrl: 'https://www.thegigify.com/email/abstract-bg.png',
    footerBgUrl: 'https://www.thegigify.com/email/abstract-bg.png',
    primary: '#0048FF',
    accent: '#0055E8',
    body: '#F3F3F3',
    text: '#333333',
};

// Mirrors `frontend/app/email/shared/EmailFooter.tsx`.
const SOCIAL_LINKS: Array<{ icon: string; href: string }> = [
    { icon: 'instagram', href: 'https://www.instagram.com/thegigifyhq?igsh=czM1N2lhdHhydGNm' },
    { icon: 'tiktok', href: 'https://www.tiktok.com/@thegigify?_r=1&_t=ZN-93E3SDzmDyg' },
    { icon: 'facebook', href: 'https://www.facebook.com/share/1AXxvN1tdo/?mibextid=wwXIfr' },
    { icon: 'twitter', href: 'https://x.com/thegigify?s=11&t=ZiS-OIMX9zXsTHU0at9-jQ' },
    { icon: 'linkedin', href: 'https://www.linkedin.com/company/the-gigify-limited/' },
];

const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const escapeAttribute = (value: string) => escapeHtml(value);

const renderButton = (label: string, href: string) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 32px;">
      <tr>
        <td bgcolor="${BRAND.primary}" style="border-radius: 4px; background-color: ${BRAND.primary};">
          <a
            href="${escapeAttribute(href)}"
            style="
              display: inline-block;
              padding: 12px 40px;
              color: #FFFFFF;
              font-family: Inter, Arial, Helvetica, sans-serif;
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

// Logo mirrors the FE template, actual hosted PNG so the brand mark looks
// the same as the marketing site, instead of a CSS-rendered circle.
const renderLogo = () => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
      <tr>
        <td style="padding-right: 8px;">
          <a href="${escapeAttribute(BRAND.siteUrl)}" style="text-decoration: none;">
            <img
              src="${escapeAttribute(BRAND.logoUrl)}"
              alt="TheGigify"
              width="28"
              height="28"
              style="display: block; border: 0; outline: none; text-decoration: none; width: 28px; height: 28px;"
            />
          </a>
        </td>
        <td style="
              color: #FFFFFF;
              font-family: Inter, Arial, Helvetica, sans-serif;
              font-size: 22px;
              font-weight: 600;
              letter-spacing: -0.01em;
              line-height: 1;
            ">
          <a href="${escapeAttribute(BRAND.siteUrl)}" style="color: #FFFFFF; text-decoration: none;">TheGigify</a>
        </td>
      </tr>
    </table>
`;

const renderSocialIcon = (icon: string, href: string) => `
    <td style="padding: 0 6px;" align="center">
      <a href="${escapeAttribute(href)}" style="text-decoration: none;">
        <img
          src="https://www.thegigify.com/email/${escapeAttribute(icon)}.png"
          alt="${escapeAttribute(icon)}"
          width="20"
          height="20"
          style="display: block; border: 0; outline: none; text-decoration: none; width: 20px; height: 20px;"
        />
      </a>
    </td>
`;

const renderFooterLinks = (supportEmail: string) => {
    const unsubscribeLink = `mailto:${supportEmail}?subject=${encodeURIComponent('Unsubscribe from Gigify emails')}`;

    return `
      <p style="margin: 0; color: #FFFFFF; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 10px; line-height: 16px; text-align: center;">
        You are receiving this mail because you registered to join THEGIGIFY.
      </p>
      <p style="margin: 4px 0 0; color: #FFFFFF; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 10px; line-height: 16px; text-align: center;">
        This also shows that you agree to our Terms of use and Privacy Policies. If you no longer want to
        receive mails from us, click
        <a href="${escapeAttribute(unsubscribeLink)}" style="color: rgba(255, 255, 255, 0.7); text-decoration: underline;">unsubscribe</a>.
      </p>
      <p style="margin: 14px 0 0; color: #FFFFFF; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 10px; line-height: 16px; text-align: center;">
        <a href="${escapeAttribute(
            `${BRAND.siteUrl}/privacy-policy`,
        )}" style="color: rgba(255, 255, 255, 0.7); text-decoration: underline;">Privacy Policy</a>
        <span style="padding: 0 8px; color: rgba(255, 255, 255, 0.6);">&bull;</span>
        <a href="${escapeAttribute(
            `${BRAND.siteUrl}/terms-of-service`,
        )}" style="color: rgba(255, 255, 255, 0.7); text-decoration: underline;">Terms of Service</a>
        <span style="padding: 0 8px; color: rgba(255, 255, 255, 0.6);">&bull;</span>
        <a href="${escapeAttribute(
            `${BRAND.siteUrl}/help-center`,
        )}" style="color: rgba(255, 255, 255, 0.7); text-decoration: underline;">Help Center</a>
      </p>
    `;
};

const renderLayout = ({ title, greetingName, contentHtml, supportEmail }: MailLayoutOptions) => {
    const resolvedSupportEmail = supportEmail?.trim() || process.env.RESEND_FROM_ADDRESS?.trim() || defaultSupportEmail;
    const currentYear = new Date().getFullYear();

    const socialIcons = SOCIAL_LINKS.map((s) => renderSocialIcon(s.icon, s.href)).join('');

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; background-color: ${BRAND.body}; padding: 0;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.body};">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 600px; max-width: 100%; background-color: ${
              BRAND.body
          };">
            <tr>
              <td
                background="${escapeAttribute(BRAND.headerBgUrl)}"
                bgcolor="${BRAND.primary}"
                style="
                  background-color: ${BRAND.primary};
                  background-image: url('${escapeAttribute(BRAND.headerBgUrl)}');
                  background-repeat: no-repeat;
                  background-size: cover;
                  background-position: center;
                  padding: 24px 24px 20px;
                  text-align: center;
                "
              >
                ${renderLogo()}
              </td>
            </tr>
            <tr>
              <td style="padding: 32px; background-color: ${BRAND.body};">
                <h1 style="margin: 0 0 14px; color: #000000; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 600; line-height: 32px; letter-spacing: -0.02em;">
                  ${escapeHtml(title)}
                </h1>
                <p style="margin: 0 0 12px; color: ${
                    BRAND.text
                }; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 600; line-height: 28px;">
                  Hello ${escapeHtml(greetingName)},
                </p>
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td
                background="${escapeAttribute(BRAND.footerBgUrl)}"
                bgcolor="#000000"
                style="
                  background-color: #000000;
                  background-image: url('${escapeAttribute(BRAND.footerBgUrl)}');
                  background-repeat: no-repeat;
                  background-size: cover;
                  background-position: center;
                  border-radius: 26px 26px 0 0;
                  padding: 40px 16px 28px;
                "
              >
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      ${renderLogo()}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 6px; color: #FFFFFF; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 10px; line-height: 14px;">
                      Follow us on our social media pages and Stay updated
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 16px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                        <tr>
                          ${socialIcons}
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid rgba(255, 255, 255, 0.6); padding-top: 16px; color: rgba(255, 255, 255, 0.65); font-family: Inter, Arial, Helvetica, sans-serif; font-size: 10px; line-height: 14px; text-align: center;">
                      © ${currentYear} GIGIFY. All rights reserved.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 16px;">
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
      ${paragraph(`Great news, the employer has funded escrow for <strong>${escapeHtml(gigTitle)}</strong>.`)}
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
      ${paragraph(`<strong>${escapeHtml(currency)} ${escapeHtml(amount)}</strong> is now available in your Gigify earnings, ready to withdraw.`)}
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
        title: 'Welcome to Gigify, Start Posting Gigs',
        greetingName: firstName,
        contentHtml,
        supportEmail,
    });
};
