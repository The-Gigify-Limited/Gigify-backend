# Gigify Figma-Exact PRD

## Source Rule

This PRD is derived from the two Figma canvases below and treats them as the product source of truth:

- Mobile canvas: `2:3`
- Web canvas: `750:11638`

The only non-Figma implementation constraints included here are the user-specified dependencies already given outside the file:

- payments use `Stripe`
- KYC uses `Sumsub`
- KYC belongs to the `User` module

When the Figma MCP text export truncated very large clustered sections, this document keeps only behavior that stayed visible in resolved node metadata, resolved node design context, root-canvas screenshots, or explicit visible screen labels already surfaced from the same canvases. No generic marketplace behavior has been added beyond that.

## Product Overview

Gigify is a multi-role booking platform for live-event talent. The canvases show three core actors:

- `Talent`: discovers gigs, receives offers, manages profile/portfolio/reviews, tracks active and upcoming work, chats with employers, and receives earnings.
- `Employer`: creates and manages gigs, reviews and selects talent, messages talent, funds gigs, releases escrowed payment, and reports problems.
- `Admin`: monitors users, gigs, reports, payouts, and verification activity.

The canvases also show shared cross-platform product systems:

- authentication and onboarding
- discovery and gig lifecycle
- direct offers
- chat and notifications
- escrow funding and release
- KYC and identity review
- transactional emails

## Screen Registry

### Canvas `2:3` Mobile Design

| Screen / Flow | Figma Evidence |
| --- | --- |
| Splash screen | `188:2131` |
| Brand / logo screen | `34:2` inside `74:1274` metadata |
| Auth hero with sign-up and login CTAs | `58:1138` |
| Sign-up method chooser overlay | `59:1222` |
| Setup account intro | `74:1274` |
| Gigs header with status chips | `2228:34113`, `2228:34115` |
| Bottom navigation | `2228:34126`, `2228:34128`, `2228:34129` |
| Review-complete feedback banner | `2228:34189` |
| Employer gig detail screen | `2228:34198` |
| Payment-release OTP screen | `2228:34326` |
| Payment-release success banner | `2228:34383` |
| Multi-talent edge-case note | `2337:34264` |

### Canvas `750:11638` Web Design

| Screen / Flow | Figma Evidence |
| --- | --- |
| Create-account page | `750:11649`, form block `750:11871` |
| Welcome email | `2406:23781`, `2406:23784`, `2406:23791` |
| Password-reset email | `2397:22680` |
| New-login-activity email | `2399:22790` |
| Discovery home feed sections such as `Gigs near you`, `Recommended gigs`, `Gigs for you`, `Upcoming gigs`, and gig-related `Offers` | visible in web root screenshot and explicitly called out by the user while pointing at the same Figma canvas |
| Employer, talent, and admin clustered dashboard/list/detail surfaces | visible in the web root screenshot and aligned with the same role groupings present across the canvases |

## Functional Inventory

### Mobile Splash

Figma evidence: `2:3 / 188:2131`

- Module: `Auth`
- Actor: unauthenticated visitor
- Entry point: app launch
- Visible data: hero image, headline `The One App Gigs towards Music Talents`, three page-indicator lines
- Primary CTA: `Create Account`
- Secondary CTA: `Login`
- Implicit system actions: route the user into registration or sign-in; preserve onboarding origin if analytics is needed
- Visible states and micro-details: current onboarding pager indicator, full-screen branded treatment, no tertiary actions
- Backend Requirements:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- no dedicated splash endpoint is required

### Mobile Brand / Logo Screen

Figma evidence: `2:3 / 34:2`

- Module: `Auth`
- Actor: unauthenticated visitor
- Entry point: app startup or branded transition
- Visible data: Gigify logo lockup and status bar
- Primary CTA: none visible on this frame
- Secondary CTA: none visible on this frame
- Implicit system actions: optional pre-auth or preload state
- Visible states and micro-details: logo-only state, no visible form controls
- Backend Requirements:
- no dedicated backend endpoint required

### Mobile Auth Hero

Figma evidence: `2:3 / 58:1138`

- Module: `Auth`
- Actor: unauthenticated visitor
- Entry point: splash CTA progression
- Visible data: hero image
- Primary CTA: `Sign Up`
- Secondary CTA: `I have an Account? Login`
- Implicit system actions: route to account creation or existing-user login
- Visible states and micro-details: full-width hero art, dual-CTA layout
- Backend Requirements:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Sign-up Method Chooser Overlay

Figma evidence: `2:3 / 59:1222`

- Module: `Auth`
- Actor: unauthenticated visitor
- Entry point: sign-up CTA on mobile
- Visible data: title `Select Option to continue`, supporting body copy, legal-consent text, close icon
- Primary CTA: `Continue with Phone Number`
- Secondary CTA: `Continue with Email`
- Implicit system actions: begin the selected registration channel; surface consent capture before continuing
- Visible states and micro-details: sheet-style overlay, two channel rows with icons and chevrons, dismiss control, legal copy referencing terms and privacy
- Backend Requirements:
- existing: `POST /api/v1/auth/register` for email path
- existing: `POST /api/v1/auth/phone/request-otp`
- existing: `POST /api/v1/auth/phone/verify`
- missing: explicit auth-channel selection tracking if the frontend needs server persistence
- dependency: Supabase Auth for auth channel orchestration

### Setup Account Intro

Figma evidence: `2:3 / 74:1274`

- Module: `User`
- Actor: newly registered user
- Entry point: after role selection or account creation
- Visible data: title `Setup Account`, explanatory copy about connecting the user with the right gigs
- Primary CTA: `Continue`
- Secondary CTA: none visible
- Implicit system actions: move the user into profile-completion onboarding
- Visible states and micro-details: `Continue` appears visually inactive in this frame, hidden back button state is present in metadata
- Backend Requirements:
- existing: `POST /api/v1/auth/set-role`
- existing: `GET /api/v1/user/:id`
- existing: `PATCH /api/v1/user/:id`
- existing: onboarding-step persistence on `users.onboarding_step`

### Web Create Account Page

Figma evidence: `750:11649`, `750:11871`

- Module: `Auth`
- Actor: unauthenticated web visitor
- Entry point: web landing/auth route
- Visible data: page title `Create Account`, email field, password field, testimonial panel, logo, legal copy
- Primary CTA: `Create Account`
- Secondary CTA: `Log In`
- Additional CTA: `Sign up with Google`
- Implicit system actions: create account, switch to login, initiate Google-based social auth, enforce privacy/terms consent
- Visible states and micro-details: divider `Or`, testimonial card, legal text referencing `Privacy Policy` and `Terms of Service`
- Backend Requirements:
- existing: `POST /api/v1/auth/register`
- existing: `POST /api/v1/auth/login`
- existing: `POST /api/v1/auth/oauth/google/url`
- existing: `POST /api/v1/auth/oauth/google/exchange`
- dependency: Supabase Auth for email-password flows and any future OAuth continuation

### Email Verification / OTP Flow

Figma evidence: mobile auth and OTP interaction patterns in `59:1222` and the resolved OTP-style payment screen `2228:34326`

- Module: `Auth`
- Actor: newly registered user
- Entry point: registration completion
- Visible data: segmented OTP input pattern, resend mechanics, verification messaging
- Primary CTA: verify / continue
- Secondary CTA: resend code
- Implicit system actions: issue OTP, validate OTP, throttle resend attempts, advance onboarding on success
- Visible states and micro-details: six-digit code entry, timer-driven resend behavior, disabled progression until valid code entry
- Backend Requirements:
- existing: `POST /api/v1/auth/verify-email`
- existing: `POST /api/v1/auth/verify-email/resend`
- existing: email-verification OTP via Supabase Auth

### Welcome Email

Figma evidence: `750:11638 / 2406:23781`, `2406:23784`, `2406:23791`

- Module: `Auth` and `Email`
- Actor: newly registered talent
- Entry point: successful account creation / onboarding completion
- Visible data: `You’re IN !`, welcome body copy, branded footer, social links, legal/help/unsubscribe links
- Primary CTA: none explicitly visible as a button in the resolved metadata
- Secondary CTA: footer links
- Implicit system actions: send a post-registration welcome/onboarding email
- Visible states and micro-details: branded illustration block, long-form welcome body copy, footer with `Privacy policy`, `Terms of service`, `Help center`, `Unsubscribe`
- Backend Requirements:
- existing: welcome-email template in the auth mail views
- existing: welcome-email trigger during talent onboarding role selection
- dependency: email delivery service

### Password Reset Email

Figma evidence: `750:11638 / 2397:22680`

- Module: `Auth` and `Email`
- Actor: user who requested password recovery
- Entry point: forgot-password action
- Visible data: `Reset Your Gigify Password`, greeting, reset CTA, expiry guidance, support copy, social/legal footer
- Primary CTA: `Reset Password`
- Secondary CTA: footer links
- Implicit system actions: issue a password-reset link, expire the link after the stated window, send email
- Visible states and micro-details: expiry copy references `30 minutes`, full legal/help/unsubscribe footer
- Backend Requirements:
- existing: `POST /api/v1/auth/forgot-password`
- dependency: Supabase password-recovery link flow
- dependency: email delivery service

### New Login Activity Email

Figma evidence: `750:11638 / 2399:22790`

- Module: `Auth` and `Email`
- Actor: authenticated account holder
- Entry point: new login detection
- Visible data: `New Login Attempt on Your Gigify Account`, greeting, dynamic login metadata, reset CTA, support copy, footer
- Primary CTA: `Reset Password`
- Secondary CTA: footer links
- Implicit system actions: send a security email whenever the platform detects a new login context
- Visible states and micro-details: dynamic placeholders `{{Device}}`, `{{Location}}`, `{{Time}}`
- Backend Requirements:
- existing: `POST /api/v1/auth/login`
- existing: login-activity email dispatch after successful login
- dependency: email delivery service

### Discovery Home Feed

Figma evidence: visible in the web root screenshot and explicitly called out by the user as part of the same Figma canvas: `gigs near them`, `recommended gigs`, `gigs for you`, `upcoming gigs`, and gig-related `offers`

- Module: `Gig Discovery`
- Actor: talent
- Entry point: home / dashboard
- Visible data: personalized gig collections and lifecycle sections
- Primary CTA: open a gig or offer card
- Secondary CTA: move into search, saved, or active gig detail flows
- Implicit system actions: personalize recommendations, calculate proximity, segment active vs upcoming, surface outstanding offers
- Visible states and micro-details: sectioned feed structure rather than a single flat list
- Backend Requirements:
- existing: `GET /api/v1/gig/discovery/home`
- existing: `GET /api/v1/gig/catalog`
- existing: `GET /api/v1/gig/explore`
- existing: `GET /api/v1/gig/search`
- existing: `GET /api/v1/gig/:id`
- existing: `GET /api/v1/gig/offers/me`
- data needs: gig coordinates, user coordinates, saved-gig state, offer state, gig lifecycle state

### Gigs List Header and Status Chips

Figma evidence: `2:3 / 2228:34113`, `2228:34115`

- Module: `Gig Management`
- Actor: employer
- Entry point: employer gigs area
- Visible data: title `Gigs`
- Primary CTA: filter by gig state
- Secondary CTA: none visible in the resolved header itself
- Implicit system actions: filter the employer's gigs into `All`, `Active`, `Offers`, and `Unpublished`
- Visible states and micro-details: active-state dot on `Active`, count badge `1`, explicit `Offers`, explicit `Unpublished`
- Backend Requirements:
- existing: `GET /api/v1/gig`
- existing: `GET /api/v1/gig/offers/me`
- existing: `GET /api/v1/gig/:id/offers`
- existing: `PATCH /api/v1/gig/:id/status`
- data needs: gig publication status, offer counts, active-gig counts

### Employer Gig Detail Screen

Figma evidence: `2:3 / 2228:34198`

- Module: `Gig`, `Chat`, `Payments`, `Reports`
- Actor: employer
- Entry point: selecting a specific gig
- Visible data: `Gig Details`, hero image, gig title, event type, date, selected talent, `Status`, description, schedule, address, distance, map card, payout block, escrow copy, next-step guidance
- Primary CTA: `Release Payment`
- Secondary CTA: `Share`, `Message`, `Report a Talent`, `View Map Here`
- Implicit system actions: open a chat with the selected talent, open the payment-release OTP flow, create a report, expand long description text, expose mapping/deep-link context
- Visible states and micro-details:
- status chip `ONGOING`
- description includes `See More`
- unread dot on `Message`
- location detail includes `25 km`
- payout block says `Paid amount In Escrow account`
- next-step guidance explains automatic gig-timer activation and dispute handling
- Backend Requirements:
- existing: `GET /api/v1/gig/:id`
- existing: `POST /api/v1/chat/conversations/open`
- existing: `POST /api/v1/earnings/payments/:id/release/request-code`
- existing: `POST /api/v1/earnings/payments/:id/release/confirm`
- existing: `POST /api/v1/gig/:id/report-talent`
- no dedicated share endpoint is required if the client shares the public gig URL and data from `GET /api/v1/gig/:id`
- no dedicated map endpoint is required if gig responses include coordinates and address metadata

### Payment Release OTP Screen

Figma evidence: `2:3 / 2228:34326`

- Module: `Payments`
- Actor: employer
- Entry point: `Release Payment` on gig detail
- Visible data: title `Enter OTP code`, explanatory copy referencing the user's email, segmented input boxes
- Primary CTA: `Confirm Code`
- Secondary CTA: back navigation and resend mechanic
- Implicit system actions: request OTP, enforce resend cooldown, validate OTP, block release on invalid or expired codes
- Visible states and micro-details:
- `Confirm Code` appears disabled in the shown state
- `Did not receive code?`
- `Resend in 01:24`
- six-character segmented input with partial and empty states
- Backend Requirements:
- existing: `POST /api/v1/earnings/payments/:id/release/request-code`
- existing: `POST /api/v1/earnings/payments/:id/release/confirm`
- existing: OTP expiry and resend cooldown response payload
- data needs: `payment_release_otps` state, expiry timestamp, attempt count

### Payment Release Success Feedback

Figma evidence: `2:3 / 2228:34383`

- Module: `Payments`
- Actor: employer
- Entry point: successful OTP confirmation
- Visible data: `Verification Successful`, success message about funds being released and the gig being completed
- Primary CTA: dismiss via close icon
- Secondary CTA: none visible
- Implicit system actions: finalize payment release, mark gig completed, notify the talent
- Visible states and micro-details: green success styling, dismiss control
- Backend Requirements:
- existing: `POST /api/v1/earnings/payments/:id/release/confirm`
- existing: payment-status transition and talent notification dispatch

### Review-Completed Feedback

Figma evidence: `2:3 / 2228:34189`

- Module: `Reviews`
- Actor: user submitting a review
- Entry point: successful review submission
- Visible data: `Review Completed`, confirmation message referencing `Dj Sarah`
- Primary CTA: dismiss via close icon
- Secondary CTA: none visible
- Implicit system actions: persist the review and refresh review state
- Visible states and micro-details: success banner with side accent and close action
- Backend Requirements:
- existing: `POST /api/v1/talent/:id/reviews`
- existing: `POST /api/v1/user/reviews`
- existing: review listing endpoints for user and talent surfaces

### Bottom Navigation

Figma evidence: `2:3 / 2228:34126`, `2228:34128`, `2228:34129`

- Module: `Navigation` across multiple backend modules
- Actor: authenticated mobile user
- Entry point: persistent mobile shell
- Visible data: `Home`, `Search`, `Gigs`, `Messages`, `Profile`
- Primary CTA: navigate between root product areas
- Secondary CTA: none visible
- Implicit system actions: hydrate the destination screen with unread counts and current user context
- Visible states and micro-details: five-tab mobile navigation, duplicated hidden/visible profile icon state
- Backend Requirements:
- `Home` requires discovery and dashboard endpoints
- `Search` requires browse/search/filter endpoints
- `Gigs` requires employer or talent gig-list endpoints
- `Messages` requires conversation list and unread-count endpoints
- `Profile` requires user/talent/employer profile endpoints

### Chat System

Figma evidence: `Message` CTA and unread dot on `2228:34198`, `Messages` tab on `2228:34129`, and chat/list/thread surfaces visible in the root canvases

- Module: `Chat`
- Actor: talent and employer
- Entry point: gig detail, messages tab, conversation list
- Visible data: conversations, messages, unread states
- Primary CTA: open conversation or send message
- Secondary CTA: mark messages read by visiting the thread
- Implicit system actions: open or reuse a conversation, increment unread counts, mark messages read
- Visible states and micro-details: unread badge behavior is implied by the gig-detail message dot and messages-tab destination
- Backend Requirements:
- existing: `GET /api/v1/chat/conversations`
- existing: `GET /api/v1/chat/conversations/unread-count`
- existing: `POST /api/v1/chat/conversations/open`
- existing: `GET /api/v1/chat/conversations/:id/messages`
- existing: `POST /api/v1/chat/conversations/:id/messages`
- existing: `POST /api/v1/chat/conversations/:id/read`
- data needs: conversations, participants, messages, unread tracking

### Notification System

Figma evidence: unread-state behavior is implied by the chat/message badges, and notification/settings surfaces are part of the clustered product areas visible across the canvases

- Module: `Notifications`
- Actor: all authenticated roles
- Entry point: notification center or settings
- Visible data: notification list, unread counts, per-item state, user preferences
- Primary CTA: open notification or mark it as read
- Secondary CTA: mark all as read, edit notification settings
- Implicit system actions: dispatch notifications from review, report, hire, payout, verification, and chat flows
- Visible states and micro-details: unread-count treatment, preference toggles
- Backend Requirements:
- existing: `GET /api/v1/notifications`
- existing: `GET /api/v1/notifications/unread-count`
- existing: `POST /api/v1/notifications/read-all`
- existing: `PATCH /api/v1/notifications/:id/read`
- existing: `GET /api/v1/user/settings/notifications`
- existing: `PATCH /api/v1/user/settings/notifications`
- data needs: notifications, notification_preferences

### Discovery, Search, Save, Apply, and Offers

Figma evidence: web discovery home callout from the same Figma canvas, mobile `Gigs` routing, and the user-visible `Offers` chip in `2228:34115`

- Module: `Gig Discovery` and `Offers`
- Actor: talent
- Entry point: home, search, saved, offers, gig detail
- Visible data: personalized gig collections, searchable results, saved gigs, applied gigs, direct offers
- Primary CTA: open gig, apply, accept or decline offer, save or unsave
- Secondary CTA: filter or share
- Implicit system actions: recommendation ranking, distance sorting, state grouping, offer lifecycle updates
- Visible states and micro-details: personalized sections, offers-specific destination, lifecycle grouping such as active and upcoming
- Backend Requirements:
- existing: `GET /api/v1/gig/discovery/home`
- existing: `GET /api/v1/gig/catalog`
- existing: `GET /api/v1/gig/explore`
- existing: `GET /api/v1/gig/search`
- existing: `GET /api/v1/gig/saved`
- existing: `POST /api/v1/gig/:id/save`
- existing: `DELETE /api/v1/gig/:id/save`
- existing: `POST /api/v1/gig/:id/apply`
- existing: `GET /api/v1/gig/my-gigs/:status`
- existing: `GET /api/v1/gig/offers/me`
- existing: `POST /api/v1/gig/:id/offers`
- existing: `GET /api/v1/gig/:id/offers`
- existing: `PATCH /api/v1/gig/offers/:offerId`
- data needs: gigs, saved_gigs, gig_applications, gig_offers

### Talent Profile, Portfolio, Reviews, Timeline, and Preferences

Figma evidence: part of the visible mobile and web marketplace profile clusters, plus resolved feedback banners and bottom-nav profile destination

- Module: `Talent` and `User`
- Actor: talent and profile viewers
- Entry point: profile tab, gig detail talent preview, review surfaces
- Visible data: profile details, portfolio items, reviews, timeline/history, notification settings
- Primary CTA: edit profile or add portfolio
- Secondary CTA: leave review, browse history, adjust settings
- Implicit system actions: persist user and talent profile changes, update portfolio, store review events, store timeline activity
- Visible states and micro-details: review confirmation state, profile-tab navigation state
- Backend Requirements:
- existing: `GET /api/v1/talent/:id`
- existing: `PATCH /api/v1/talent/:id`
- existing: `GET /api/v1/talent/:id/portfolios`
- existing: `POST /api/v1/talent/portfolios`
- existing: `DELETE /api/v1/talent/portfolios/:talentPortfolioId`
- existing: `GET /api/v1/talent/:id/reviews`
- existing: `POST /api/v1/talent/:id/reviews`
- existing: `GET /api/v1/user/:id`
- existing: `PATCH /api/v1/user/:id`
- existing: `GET /api/v1/user/me/timeline`
- existing: `GET /api/v1/user/:id/reviews`
- existing: `POST /api/v1/user/reviews`

### Employer Dashboard, Profile, Create/Edit/Delete Gig, Applicants, and Hiring

Figma evidence: employer cluster headers in the mobile root, resolved employer gig-detail screen `2228:34198`, user-visible offers/gig-state chips, and visible employer/dashboard groupings in the web root screenshot

- Module: `Employer` and `Gig Management`
- Actor: employer
- Entry point: employer dashboard and employer gig-management area
- Visible data: employer profile, gig lists, applicant lists, selected talent, gig status, offer state
- Primary CTA: create or manage a gig
- Secondary CTA: review applicants, hire talent, send offers, change status
- Implicit system actions: employer stats sync, multi-talent filling logic, gig publication state changes
- Visible states and micro-details: `All`, `Active`, `Offers`, `Unpublished`, selected-talent state, ongoing status state
- Backend Requirements:
- existing: `GET /api/v1/employer/me`
- existing: `PATCH /api/v1/employer/me`
- existing: `GET /api/v1/employer/dashboard`
- existing: `POST /api/v1/gig`
- existing: `GET /api/v1/gig`
- existing: `PATCH /api/v1/gig/:id`
- existing: `DELETE /api/v1/gig/:id`
- existing: `PATCH /api/v1/gig/:id/status`
- existing: `GET /api/v1/gig/:id/applications`
- existing: `POST /api/v1/gig/:id/hire/:talentId`
- existing: `POST /api/v1/gig/:id/offers`

### Escrow Funding and Earnings

Figma evidence: employer gig-detail payout block in `2228:34198`, payment-release OTP flow in `2228:34326`, and the broader payments/earnings surfaces already visible across the canvases

- Module: `Payments` and `Earnings`
- Actor: employer and talent
- Entry point: employer payment flow, employer release flow, talent earnings area
- Visible data: escrowed amount, payout budget, earnings history, payout requests
- Primary CTA: process payment or request payout
- Secondary CTA: release escrowed funds after verification
- Implicit system actions: create payment records, move payment state, compute available balance, create payout requests
- Visible states and micro-details: escrow wording, release verification, talent earnings history
- Backend Requirements:
- existing: `POST /api/v1/earnings/payments/process`
- existing: `POST /api/v1/earnings/payments/stripe/checkout-session`
- existing: `POST /api/v1/earnings/payments/stripe/webhook`
- existing: `GET /api/v1/earnings/me`
- existing: `GET /api/v1/earnings/history`
- existing: `POST /api/v1/earnings/payout-requests`
- dependency: `Stripe`
- data needs: payments, payout_requests, payment_release_otps

### KYC / Identity Verification

Figma evidence: KYC was explicitly identified by the user as a visible missed flow in the same product file family, and admin identity-review surfaces are part of the platform scope shown in the canvases

- Module: `User`
- Actor: user submitting verification and admin reviewing verification
- Entry point: user verification flow and admin review queue
- Visible data: verification status and review outcome
- Primary CTA: submit verification materials
- Secondary CTA: admin review or rejection
- Implicit system actions: create a verification session, persist submission state, notify the user when reviewed
- Visible states and micro-details: pending, approved, and rejected verification outcomes
- Backend Requirements:
- existing: `POST /api/v1/user/onboarding/liveness`
- existing: `POST /api/v1/user/kyc/session`
- existing: `GET /api/v1/user/kyc/status`
- existing: `POST /api/v1/user/kyc/webhooks/sumsub`
- existing: `GET /api/v1/admin/identity-verifications`
- existing: `PATCH /api/v1/admin/identity-verifications/:id`
- dependency: `Sumsub`
- data needs: `identity_verifications`

### Admin Oversight

Figma evidence: mobile root admin header `925:6801`, web root admin cluster visibility, and the already surfaced moderation/review product family tied to the same Figma audit

- Module: `Admin`
- Actor: admin
- Entry point: admin dashboard and review queues
- Visible data: dashboards, user lists, gig lists, reports, payout requests, identity verifications, audit records
- Primary CTA: review or update status
- Secondary CTA: broadcast notifications
- Implicit system actions: moderation state changes, audit logging, outbound notifications to affected users
- Visible states and micro-details: queue-style operational views and moderation/review actions
- Backend Requirements:
- existing: `GET /api/v1/admin/dashboard`
- existing: `GET /api/v1/admin/users`
- existing: `PATCH /api/v1/admin/users/:id/status`
- existing: `GET /api/v1/admin/gigs`
- existing: `PATCH /api/v1/admin/gigs/:id/status`
- existing: `GET /api/v1/admin/reports`
- existing: `PATCH /api/v1/admin/reports/:id`
- existing: `GET /api/v1/admin/payout-requests`
- existing: `PATCH /api/v1/admin/payout-requests/:id`
- existing: `GET /api/v1/admin/identity-verifications`
- existing: `PATCH /api/v1/admin/identity-verifications/:id`
- existing: `GET /api/v1/admin/audit-logs`
- existing: `POST /api/v1/admin/notifications/broadcast`

### Multi-Talent Gig Edge Case

Figma evidence: `2:3 / 2337:34264`

- Module: `Gig Management`
- Actor: employer and platform logic
- Entry point: gig creation and hiring flow
- Visible data: explicit note `Edge case: when the user selects more that one talent required for his gig`
- Primary CTA: none, this is a design note
- Secondary CTA: none
- Implicit system actions: keep the gig open until all required talent slots are filled; support more than one accepted/hired talent for the same gig
- Visible states and micro-details: explicit warning against single-talent assumptions
- Backend Requirements:
- existing: multi-talent support in hiring and offer expiration logic
- data needs: `gigs.required_talent_count`, application and offer status state

## Backend Implication Matrix

| Figma Screen / Flow | Functionality | Module | Existing Backend Support | Missing Backend Support | Data / Table Need | Integration Dependency |
| --- | --- | --- | --- | --- | --- | --- |
| Mobile splash | create-account and login entry | Auth | `POST /auth/register`, `POST /auth/login` | none | none | Supabase Auth |
| Mobile auth hero | sign-up vs login routing | Auth | `POST /auth/register`, `POST /auth/login` | none | none | Supabase Auth |
| Sign-up method chooser | choose phone or email sign-up | Auth | `POST /auth/register`, `POST /auth/phone/request-otp`, `POST /auth/phone/verify` | auth-channel selection persistence is still optional if the frontend needs analytics/state persistence | auth user state only | Supabase Auth |
| Setup account intro | onboarding continuation | User | `POST /auth/set-role`, `GET/PATCH /user/:id` | richer onboarding-step APIs are optional but not required by the visible frame | `users.onboarding_step` | none |
| Web create account | email-password registration | Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/oauth/google/url`, `POST /auth/oauth/google/exchange` | none | auth user state only | Supabase Auth |
| Welcome email | post-signup success email | Email | welcome template and role-triggered delivery exist | none | none | email delivery |
| Email verification | verify OTP and resend | Auth | `POST /auth/verify-email`, `POST /auth/verify-email/resend` | none | Supabase OTP state | Supabase Auth |
| Password-reset email | recover password | Auth | `POST /auth/forgot-password` | none for the visible email step | reset-token state handled by provider | Supabase Auth, email delivery |
| New login activity email | security notification | Auth | login activity email is implemented | none | audit/security context only | email delivery |
| Discovery home feed | near-you, recommended, gigs-for-you, upcoming, offers | Gig Discovery | `GET /gig/discovery/home` | none at route level | gigs, offers, coordinates | none |
| Search and browse | catalog, explore, filters | Gig Discovery | `GET /gig/catalog`, `/gig/explore`, `/gig/search` | none | gigs, coordinates | none |
| Saved gigs | save and unsave | Gig Discovery | `GET /gig/saved`, `POST/DELETE /gig/:id/save` | none | `saved_gigs` | none |
| Apply flow | apply to a gig | Gig Discovery | `POST /gig/:id/apply` | none | `gig_applications` | none |
| Offers | employer creates, talent responds, both view state | Offers | `POST /gig/:id/offers`, `GET /gig/:id/offers`, `GET /gig/offers/me`, `PATCH /gig/offers/:offerId` | none | `gig_offers` | notifications |
| Employer gigs header | `All`, `Active`, `Offers`, `Unpublished` filters | Employer / Gig | generic list and offer routes exist | status-to-filter mapping must stay aligned with UI vocabulary | gigs, offers | none |
| Employer gig detail | view detail, selected talent, share, message, release, report | Gig / Chat / Payments / Reports | `GET /gig/:id`, chat open, release OTP, report routes exist | share needs no endpoint unless analytics is added | gigs, payments, reports | chat, notifications |
| Payment release OTP | request code, verify code, release escrow | Payments | request-code and confirm routes exist | none | `payments`, `payment_release_otps` | email delivery |
| Payment success feedback | post-release success state | Payments | confirm route and notifications exist | none | payments | notifications |
| Review-complete feedback | confirm review submission | Reviews | `POST /talent/:id/reviews`, `POST /user/reviews` | none | reviews tables | notifications |
| Bottom navigation | home, search, gigs, messages, profile | Shared shell | destination modules all exist | none | none | none |
| Chat | conversations, messages, unread | Chat | full chat route set exists | none | `conversations`, `messages` | notifications |
| Notifications | list, unread-count, read-one, read-all, preferences | Notifications | full notification route set exists | none | `notifications`, `notification_preferences` | none |
| Talent profile and portfolio | view/edit talent profile, portfolio, reviews | Talent / User | profile, portfolio, and review routes exist | none | users, talents, portfolios, reviews | none |
| Employer dashboard and gig ops | profile, dashboard, create/edit/delete gig, applicants, hire | Employer / Gig | employer and gig routes exist | none | employers, gigs, applications | none |
| Escrow funding | employer records payment for a gig | Payments | `POST /earnings/payments/process`, `POST /earnings/payments/stripe/checkout-session`, and `POST /earnings/payments/stripe/webhook` exist | none | `payments` | Stripe |
| Earnings and payouts | earnings summary, history, payout request | Earnings | earnings and payout routes exist | none at route level | `payments`, `payout_requests` | none |
| KYC / identity verification | user submits verification and admin reviews it | User / Admin | liveness submit, Sumsub launch/status/webhook routes, and admin review routes exist | none | `identity_verifications` | Sumsub |
| Admin moderation | dashboard, users, gigs, reports, payouts, KYC, audit, broadcasts | Admin | full admin route set exists | none | admin-facing tables already exist | notifications |
| Multi-talent edge case | support more than one selected talent for a gig | Gig | multi-talent hiring support exists | none | `gigs.required_talent_count` | none |

## Appendix A: Explicit Edge Cases, Timers, Statuses, and Dynamic Tokens

- Mobile splash shows a three-line pager indicator state.
- Mobile method chooser includes `Continue with Phone Number` and `Continue with Email`.
- Mobile method chooser includes legal-consent copy tied to `Terms & Conditions` and `Privacy Policy`.
- Setup-account intro shows a visually inactive `Continue` state.
- Web create-account page shows `Sign up with Google`.
- Web create-account page shows the text switch `If you have an account? Log In`.
- Password-reset email includes link-expiry messaging for `30 minutes`.
- New-login-activity email includes dynamic tokens for `{{Device}}`, `{{Location}}`, and `{{Time}}`.
- Transactional emails include footer links for `Privacy policy`, `Terms of service`, `Help center`, and `Unsubscribe`.
- Employer gig detail shows the status chip `ONGOING`.
- Employer gig detail description includes `See More`.
- Employer gig detail includes `View Map Here`.
- Employer gig detail includes a `Message` action with an unread dot.
- Employer gig detail includes the payout copy `Paid amount In Escrow account`.
- Employer gig detail includes `What happens next?` instructional copy.
- Payment-release OTP screen includes `Did not receive code?`.
- Payment-release OTP screen includes `Resend in 01:24`.
- Payment-release OTP screen shows partially filled and empty segmented code boxes.
- Payment-release OTP screen shows a disabled-looking `Confirm Code` state.
- Gigs header includes filter chips `All`, `Active`, `Offers`, and `Unpublished`.
- The `Active` chip includes a dot and a count badge `1`.
- Bottom navigation includes `Home`, `Search`, `Gigs`, `Messages`, and `Profile`.
- Feedback banners include a closable `Review Completed` success state.
- Feedback banners include a closable `Verification Successful` success state.
- The canvas includes an explicit edge-case note for gigs that require more than one talent.

## Appendix B: Current Backend Gaps Called Out by the PRD

- Phone-number authentication flow is implemented.
- Google OAuth initiation and code exchange flow are implemented.
- Welcome-email sending is implemented for the Figma onboarding path.
- Stripe-native checkout and webhook reconciliation are implemented.
- Sumsub-native KYC orchestration is implemented.
