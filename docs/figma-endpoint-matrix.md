# Gigify Figma Endpoint Matrix

See also: [figma-exact-prd.md](/Users/apple/Documents/Work/Gigify/backend/docs/figma-exact-prd.md)

This matrix tracks the backend coverage needed for the current Figma source files:

- Mobile canvas: `2:3`
- Web canvas: `750:11638`

The Figma roots contain duplicate mobile and web variants for the same domain workflows, so the API surface below is grouped by module instead of by duplicate frame.

## Auth and Onboarding

- Splash, create account, login, forgot password, password reset email, login security email
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/phone/request-otp`
  - `POST /api/v1/auth/phone/verify`
  - `POST /api/v1/auth/oauth/google/url`
  - `POST /api/v1/auth/oauth/google/exchange`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/set-role`
- User setup and profile completion
  - `GET /api/v1/user/:id`
  - `PATCH /api/v1/user/:id`
  - `POST /api/v1/user/onboarding/liveness`
  - `POST /api/v1/user/kyc/session`
  - `GET /api/v1/user/kyc/status`

## Discovery and Marketplace

- Home sections such as gigs near you, recommended gigs, gigs for you, active gigs, upcoming gigs, and received offers
  - `GET /api/v1/gig/discovery/home`
- Browse, search, and filter gigs
  - `GET /api/v1/gig/catalog`
  - `GET /api/v1/gig/explore`
  - `GET /api/v1/gig/search`
  - `GET /api/v1/gig/:id`
- Saved gigs
  - `GET /api/v1/gig/saved`
  - `POST /api/v1/gig/:id/save`
  - `DELETE /api/v1/gig/:id/save`
- Apply flow
  - `POST /api/v1/gig/:id/apply`
  - `GET /api/v1/gig/my-gigs/:status`

## Direct Offers

- Employer sends an offer tied to a gig
  - `POST /api/v1/gig/:id/offers`
- Employer reviews offers on a gig
  - `GET /api/v1/gig/:id/offers`
- Talent or employer views their own offer feed
  - `GET /api/v1/gig/offers/me`
- Talent accepts or declines, employer withdraws
  - `PATCH /api/v1/gig/offers/:offerId`

## Employer Gig Operations

- Employer dashboard and profile
  - `GET /api/v1/employer/dashboard`
  - `GET /api/v1/employer/me`
  - `PATCH /api/v1/employer/me`
- Create and manage gigs
  - `POST /api/v1/gig`
  - `PATCH /api/v1/gig/:id`
  - `DELETE /api/v1/gig/:id`
  - `PATCH /api/v1/gig/:id/status`
- Review applicants and hire talents
  - `GET /api/v1/gig/:id/applications`
  - `POST /api/v1/gig/:id/hire/:talentId`
- Employer detail screen actions from the inspected mobile flow
  - `POST /api/v1/chat/conversations/open`
  - `POST /api/v1/earnings/payments/:id/release/request-code`
  - `POST /api/v1/earnings/payments/:id/release/confirm`
  - `POST /api/v1/gig/:id/report-talent`

## Talent Profile and Earnings

- Talent profile, portfolio, and reviews
  - `GET /api/v1/talent/:id`
  - `PATCH /api/v1/talent/:id`
  - `GET /api/v1/talent/:id/portfolios`
  - `POST /api/v1/talent/portfolios`
  - `DELETE /api/v1/talent/portfolios/:talentPortfolioId`
  - `GET /api/v1/talent/:id/reviews`
  - `POST /api/v1/talent/:id/reviews`
- Earnings and payout
  - `GET /api/v1/earnings/me`
  - `GET /api/v1/earnings/history`
  - `POST /api/v1/earnings/payout-requests`

## Payments, Notifications, and Chat

- Employer payment processing
  - `POST /api/v1/earnings/payments/process`
  - `POST /api/v1/earnings/payments/stripe/checkout-session`
  - `POST /api/v1/earnings/payments/stripe/webhook`
- Notification center
  - `GET /api/v1/notifications`
  - `GET /api/v1/notifications/unread-count`
  - `POST /api/v1/notifications/read-all`
  - `PATCH /api/v1/notifications/:id/read`
- Chat system
  - `GET /api/v1/chat/conversations`
  - `GET /api/v1/chat/conversations/unread-count`
  - `POST /api/v1/chat/conversations/open`
  - `GET /api/v1/chat/conversations/:id/messages`
  - `POST /api/v1/chat/conversations/:id/messages`
  - `POST /api/v1/chat/conversations/:id/read`

## Reviews, Timeline, and Preferences

- User reviews and timeline
  - `POST /api/v1/user/reviews`
  - `GET /api/v1/user/:id/reviews`
  - `GET /api/v1/user/me/timeline`
- Notification settings
  - `GET /api/v1/user/settings/notifications`
  - `PATCH /api/v1/user/settings/notifications`

## Admin

- Dashboard and user moderation
  - `GET /api/v1/admin/dashboard`
  - `GET /api/v1/admin/users`
  - `PATCH /api/v1/admin/users/:id/status`
- Gig moderation
  - `GET /api/v1/admin/gigs`
  - `PATCH /api/v1/admin/gigs/:id/status`
- Reports, payouts, and identity verification
  - `GET /api/v1/admin/reports`
  - `PATCH /api/v1/admin/reports/:id`
  - `GET /api/v1/admin/payout-requests`
  - `PATCH /api/v1/admin/payout-requests/:id`
  - `GET /api/v1/admin/identity-verifications`
  - `PATCH /api/v1/admin/identity-verifications/:id`
- Audit and broadcast
  - `GET /api/v1/admin/audit-logs`
  - `POST /api/v1/admin/notifications/broadcast`

## Notes

- Web and mobile screen variants reuse the same backend modules.
- Swagger remains the executable API reference at `/api/v1/api-docs`.
- The discovery and offers additions were introduced to cover the web home sections and the gig-related offer flows surfaced in the current Figma audit.
- The provider-native gaps called out during the Figma PRD pass are now covered by the Stripe escrow funding endpoints and the Sumsub KYC session/status/webhook flow.
