import { ControlBuilder, paymentReleaseOtpRateLimiter } from '@/core';
import { Router } from 'express';
import {
    addDisputeEvidence,
    confirmPaymentRelease,
    createStripeCheckoutSession,
    getDispute,
    getMyEarnings,
    getPaymentHistory,
    handleStripeWebhook,
    listDisputes,
    openDispute,
    processPayment,
    requestPaymentReleaseOtp,
    requestPayout,
} from '../services';
import {
    addDisputeEvidenceSchema,
    confirmPaymentReleaseSchema,
    createStripeCheckoutSessionSchema,
    disputeIdParamsSchema,
    listDisputesQuerySchema,
    openDisputeSchema,
    paymentHistorySchema,
    paymentReleaseParamsSchema,
    processPaymentSchema,
    requestPayoutSchema,
} from './schema';

export const earningsRouter = Router();

/**
 * @swagger
 * /earnings/me:
 *   get:
 *     tags: [Earnings]
 *     summary: Get the current talent's earnings summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings summary
 *         content:
 *           application/json:
 *             example:
 *               message: Earnings Summary Retrieved Successfully
 *               data:
 *                 totalEarned: 1400
 *                 pendingPayments: 180000
 *                 availableForPayout: 90000
 *                 totalRequestedPayouts: 90000
 *                 currency: NGN
 */
earningsRouter.get(
    '/me',
    ControlBuilder.builder()
        .only('talent')
        .setHandler(getMyEarnings.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/history:
 *   get:
 *     tags: [Earnings]
 *     summary: Get payment history for the current talent
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history
 *         content:
 *           application/json:
 *             example:
 *               message: Payment History Retrieved Successfully
 *               data:
 *                 - id: 70000000-0000-0000-0000-000000000001
 *                   gigId: 50000000-0000-0000-0000-000000000002
 *                   amount: 180000
 *                   currency: NGN
 *                   status: processing
 */
earningsRouter.get(
    '/history',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(paymentHistorySchema)
        .setHandler(getPaymentHistory.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/payout-requests:
 *   post:
 *     tags: [Earnings]
 *     summary: Request a payout from available earnings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             amount: 90000
 *             currency: NGN
 *             note: Partial payout before event weekend.
 *     responses:
 *       201:
 *         description: Payout request submitted
 *         content:
 *           application/json:
 *             example:
 *               message: Payout Request Submitted Successfully
 *               data:
 *                 id: 71000000-0000-0000-0000-000000000001
 *                 talentId: 20000000-0000-0000-0000-000000000002
 *                 amount: 90000
 *                 currency: NGN
 *                 status: requested
 */
earningsRouter.post(
    '/payout-requests',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(requestPayoutSchema)
        .setHandler(requestPayout.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/payments/process:
 *   post:
 *     tags: [Earnings]
 *     summary: Process or settle a payment as an employer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             gigId: 50000000-0000-0000-0000-000000000002
 *             talentId: 20000000-0000-0000-0000-000000000002
 *             amount: 180000
 *             currency: NGN
 *             provider: manual
 *             paymentReference: PAY-GIG-002
 *     responses:
 *       200:
 *         description: Payment processed
 *         content:
 *           application/json:
 *             example:
 *               message: Payment Processed Successfully
 *               data:
 *                 id: 70000000-0000-0000-0000-000000000001
 *                 status: processing
 *                 amount: 180000
 *                 currency: NGN
 */
earningsRouter.post(
    '/payments/process',
    ControlBuilder.builder()
        .only('employer')
        .setValidator(processPaymentSchema)
        .setHandler(processPayment.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/payments/stripe/checkout-session:
 *   post:
 *     tags: [Earnings]
 *     summary: Create a Stripe Checkout session to fund gig escrow
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             gigId: 50000000-0000-0000-0000-000000000002
 *             talentId: 20000000-0000-0000-0000-000000000002
 *             amount: 180000
 *             currency: NGN
 *             successUrl: https://app.gigify.com/employer/gigs/50000000-0000-0000-0000-000000000002/payment/success
 *             cancelUrl: https://app.gigify.com/employer/gigs/50000000-0000-0000-0000-000000000002/payment/cancel
 *     responses:
 *       201:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             example:
 *               message: Stripe Checkout Session Created Successfully
 *               data:
 *                 payment:
 *                   id: 70000000-0000-0000-0000-000000000011
 *                   status: pending
 *                   provider: stripe
 *                 checkout:
 *                   sessionId: cs_test_123
 *                   url: https://checkout.stripe.com/c/pay/cs_test_123
 *                   expiresAt: "2026-03-13T12:45:00.000Z"
 */
earningsRouter.post(
    '/payments/stripe/checkout-session',
    ControlBuilder.builder()
        .only('employer')
        .setValidator(createStripeCheckoutSessionSchema)
        .setHandler(createStripeCheckoutSession.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/payments/stripe/webhook:
 *   post:
 *     tags: [Earnings]
 *     summary: Receive Stripe payment events and reconcile escrow state
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             id: evt_123
 *             type: checkout.session.completed
 *             data:
 *               object:
 *                 id: cs_test_123
 *                 payment_intent: pi_123
 *                 metadata:
 *                   paymentId: 70000000-0000-0000-0000-000000000011
 *     responses:
 *       200:
 *         description: Webhook processed
 *         content:
 *           application/json:
 *             example:
 *               message: Stripe Webhook Processed Successfully
 *               data:
 *                 acknowledged: true
 *                 handled: true
 *                 eventType: checkout.session.completed
 *                 paymentId: 70000000-0000-0000-0000-000000000011
 *                 status: processing
 */
earningsRouter.post(
    '/payments/stripe/webhook',
    ControlBuilder.builder().setHandler(handleStripeWebhook.handle).handle(),
);

/**
 * @swagger
 * /earnings/payments/{id}/release/request-code:
 *   post:
 *     tags: [Earnings]
 *     summary: Request an OTP code to release escrow payment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP requested
 *         content:
 *           application/json:
 *             example:
 *               message: Payment Release OTP Requested Successfully
 *               data:
 *                 paymentId: 70000000-0000-0000-0000-000000000003
 *                 expiresInMinutes: 10
 */
earningsRouter.post(
    '/payments/:id/release/request-code',
    paymentReleaseOtpRateLimiter,
    ControlBuilder.builder()
        .only('employer')
        .setValidator(paymentReleaseParamsSchema)
        .setHandler(requestPaymentReleaseOtp.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/payments/{id}/release/confirm:
 *   post:
 *     tags: [Earnings]
 *     summary: Confirm payment release with an OTP code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             code: "882315"
 *     responses:
 *       200:
 *         description: Payment released
 *         content:
 *           application/json:
 *             example:
 *               message: Payment Released Successfully
 *               data:
 *                 payment:
 *                   id: 70000000-0000-0000-0000-000000000003
 *                   status: paid
 *                 gig:
 *                   id: 50000000-0000-0000-0000-000000000004
 *                   status: completed
 */
earningsRouter.post(
    '/payments/:id/release/confirm',
    paymentReleaseOtpRateLimiter,
    ControlBuilder.builder()
        .only('employer')
        .setValidator(confirmPaymentReleaseSchema)
        .setHandler(confirmPaymentRelease.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/payments/{id}/dispute:
 *   post:
 *     tags: [Earnings]
 *     summary: Open a dispute against a payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             reason: Service not delivered
 *             description: Talent cancelled the day-of. We have screenshots in chat.
 *     responses:
 *       201:
 *         description: Dispute opened; gig status flipped to disputed
 */
earningsRouter.post(
    '/payments/:id/dispute',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(openDisputeSchema)
        .setHandler(openDispute.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/disputes:
 *   get:
 *     tags: [Earnings]
 *     summary: List disputes the current user is a party to
 *     security:
 *       - bearerAuth: []
 */
earningsRouter.get(
    '/disputes',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(listDisputesQuerySchema)
        .setHandler(listDisputes.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/disputes/{id}:
 *   get:
 *     tags: [Earnings]
 *     summary: Get a dispute the current user is a party to
 *     security:
 *       - bearerAuth: []
 */
earningsRouter.get(
    '/disputes/:id',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(disputeIdParamsSchema)
        .setHandler(getDispute.handle)
        .handle(),
);

/**
 * @swagger
 * /earnings/disputes/{id}/evidence:
 *   post:
 *     tags: [Earnings]
 *     summary: Attach evidence to a dispute via a file URL
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             evidenceType: screenshot
 *             fileUrl: https://cdn.gigify.app/evidence/abc.png
 *             notes: Chat confirms the cancellation timestamp
 */
earningsRouter.post(
    '/disputes/:id/evidence',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(addDisputeEvidenceSchema)
        .setHandler(addDisputeEvidence.handle)
        .handle(),
);
