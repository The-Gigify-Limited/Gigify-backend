import { ControlBuilder, paymentReleaseOtpRateLimiter } from '@/core';
import { Router } from 'express';
import { confirmPaymentRelease, getMyEarnings, getPaymentHistory, processPayment, requestPaymentReleaseOtp, requestPayout } from '../services';
import { confirmPaymentReleaseSchema, paymentHistorySchema, paymentReleaseParamsSchema, processPaymentSchema, requestPayoutSchema } from './schema';

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
earningsRouter.get('/me', ControlBuilder.builder().only('talent').setHandler(getMyEarnings.handle).handle());

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
earningsRouter.get('/history', ControlBuilder.builder().only('talent').setValidator(paymentHistorySchema).setHandler(getPaymentHistory.handle).handle());

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
earningsRouter.post('/payout-requests', ControlBuilder.builder().only('talent').setValidator(requestPayoutSchema).setHandler(requestPayout.handle).handle());

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
earningsRouter.post('/payments/process', ControlBuilder.builder().only('employer').setValidator(processPaymentSchema).setHandler(processPayment.handle).handle());

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
    ControlBuilder.builder().only('employer').setValidator(paymentReleaseParamsSchema).setHandler(requestPaymentReleaseOtp.handle).handle(),
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
    ControlBuilder.builder().only('employer').setValidator(confirmPaymentReleaseSchema).setHandler(confirmPaymentRelease.handle).handle(),
);
