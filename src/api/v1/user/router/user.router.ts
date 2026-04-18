import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    createKycSession,
    createUserReview,
    deleteUserById,
    getAllUsers,
    getKycStatus,
    getNotificationPreferences,
    getUserById,
    getUserReviews,
    getUserTimeline,
    handleSumsubWebhook,
    submitLivenessCheck,
    updateNotificationPreferences,
    updateUserById,
} from '../services';
import {
    createUserReviewSchema,
    getUserParamsSchema,
    getUsersQuerySchema,
    kycSessionSchema,
    livenessSchema,
    notificationPreferencesSchema,
    timelineQuerySchema,
    updateUserSchema,
    userReviewsSchema,
} from './schema';

export const userRouter = Router();

userRouter
    /**
     * @swagger
     * /user/{id}:
     *   get:
     *     tags: [User Profile]
     *     summary: Get user by ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: User profile
     *         content:
     *           application/json:
     *             example:
     *               message: User Retrieved Successfully
     *               data:
     *                 id: 20000000-0000-0000-0000-000000000001
     *                 firstName: Maxwell
     *                 lastName: Adeyemi
     *                 role: talent
     *                 locationCity: Lagos
     *       401:
     *         description: Unauthorized
     */
    .get(
        '/:id',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(getUserParamsSchema)
            .setHandler(getUserById.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user:
     *   get:
     *     summary: List users
     *     tags: [User Profile]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: pageSize
     *         schema:
     *           type: integer
     *       - in: query
     *         name: role
     *         schema:
     *           type: string
     *           enum: [talent, employer]
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Users list
     *         content:
     *           application/json:
     *             example:
     *               message: Users Retrieved Successfully
     *               data:
     *                 - id: 20000000-0000-0000-0000-000000000001
     *                   username: djmaxell
     *                   role: talent
     *                 - id: 10000000-0000-0000-0000-000000000002
     *                   username: pulselive
     *                   role: employer
     *       401:
     *         description: Unauthorized
     */
    .get(
        '/',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(getUsersQuerySchema)
            .setHandler(getAllUsers.handle)
            .handle(),
    )
    /**
     * @swagger
     * /user/{id}:
     *   patch:
     *     tags: [User Profile]
     *     summary: Update user profile by ID
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
     *           schema:
     *             type: object
     *           example:
     *             firstName: Maxwell
     *             lastName: Adeyemi
     *             phoneNumber: "+234810000001"
     *             locationCountry: Nigeria
     *             locationCity: Lagos
     *             locationLatitude: 6.5244
     *             locationLongitude: 3.3792
     *             fullAddress: 24 Allen Avenue, Ikeja
     *             postCode: 100282
     *             username: djmaxell
     *             dateOfBirth: "1995-06-15"
     *             streetAddress: 24 Allen Avenue
     *             acquisitionSource: referral
     *             bio: DJ and event producer based in Lagos.
     *     responses:
     *       200:
     *         description: Updated profile
     *         content:
     *           application/json:
     *             example:
     *               message: User Updated Successfully
     *               data:
     *                 id: 20000000-0000-0000-0000-000000000001
     *                 username: djmaxell
     *                 locationCity: Lagos
     *       401:
     *         description: Unauthorized
     */
    .patch(
        '/:id',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(updateUserSchema)
            .setHandler(updateUserById.handle)
            .checkResourceOwnership('user', 'id')
            .handle(),
    )
    /**
     * @swagger
     * /user/{id}:
     *   delete:
     *     tags: [User Profile]
     *     summary: Soft delete user account by ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Account soft deleted
     *         content:
     *           application/json:
     *             example:
     *               message: User Deleted Successfully
     *       401:
     *         description: Unauthorized
     */
    .delete(
        '/:id',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(getUserParamsSchema)
            .setHandler(deleteUserById.handle)
            .checkResourceOwnership('user', 'id')
            .handle(),
    )

    /**
     * @swagger
     * /user/reviews:
     *   post:
     *     tags: [User Reviews]
     *     summary: Submit a new review
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               reviewee_id: { type: string, format: uuid }
     *               gig_id: { type: string, format: uuid }
     *               rating: { type: number, minimum: 1, maximum: 5 }
     *               comment: { type: string }
     *           example:
     *             revieweeId: 20000000-0000-0000-0000-000000000002
     *             gigId: 50000000-0000-0000-0000-000000000002
     *             rating: 5
     *             comment: Ada was polished and easy to work with throughout the event.
     *     responses:
     *       201:
     *         description: Review submitted successfully
     *         content:
     *           application/json:
     *             example:
     *               message: Review Created Successfully
     *               data:
     *                 id: 32000000-0000-0000-0000-000000000001
     *                 rating: 5
     *                 comment: Ada was polished and easy to work with throughout the event.
     */
    .post(
        '/reviews',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(createUserReviewSchema)
            .setHandler(createUserReview.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/me/timeline:
     *   get:
     *     tags: [User Activity]
     *     summary: Get user activity timeline
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of user activities (joined, paid, etc.)
     *         content:
     *           application/json:
     *             example:
     *               message: User Timeline Retrieved Successfully
     *               data:
     *                 - id: 91000000-0000-0000-0000-000000000002
     *                   eventType: gig_started
     *                   referenceId: 50000000-0000-0000-0000-000000000002
     */
    .get(
        '/me/timeline',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(timelineQuerySchema)
            .setHandler(getUserTimeline.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/{id}/reviews:
     *   get:
     *     tags: [User Reviews]
     *     summary: Get reviews for a specific user
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: List of reviews and average rating
     *         content:
     *           application/json:
     *             example:
     *               message: User Reviews Retrieved Successfully
     *               data:
     *                 averageRating: 4.8
     *                 reviews:
     *                   - id: 32000000-0000-0000-0000-000000000001
     *                     rating: 5
     *                     comment: Ada was polished and easy to work with throughout the event.
     */
    .get(
        '/:id/reviews',
        ControlBuilder.builder()
            .setValidator(userReviewsSchema)
            .setHandler(getUserReviews.handle)
            .handle(),
    )
    /**
     * @swagger
     * /user/onboarding/liveness:
     *   post:
     *     tags: [User Identity]
     *     summary: Upload liveness video/photo for identity verification
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               media_url: { type: string }
     *               id_type: { type: string, enum: [passport, drivers_license] }
     *           example:
     *             mediaUrl: https://storage.gigify.app/id/maxell-id.jpg
     *             selfieUrl: https://storage.gigify.app/id/maxell-selfie.mp4
     *             idType: national_id
     *     responses:
     *       200:
     *         description: Verification submitted for review
     *         content:
     *           application/json:
     *             example:
     *               message: Liveness Check Submitted Successfully
     *               data:
     *                 id: 92000000-0000-0000-0000-000000000001
     *                 status: pending
     */
    .post(
        '/onboarding/liveness',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(livenessSchema)
            .setHandler(submitLivenessCheck.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/kyc/session:
     *   post:
     *     tags: [User Identity]
     *     summary: Create a Sumsub verification session for the current user
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           example:
     *             levelName: gigify-basic-kyc
     *     responses:
     *       201:
     *         description: KYC session created
     *         content:
     *           application/json:
     *             example:
     *               message: KYC Session Created Successfully
     *               data:
     *                 verification:
     *                   id: 92000000-0000-0000-0000-000000000011
     *                   provider: sumsub
     *                   status: pending
     *                   providerApplicantId: sumsub-applicant-1
     *                 session:
     *                   applicantId: sumsub-applicant-1
     *                   token: sumsub-sdk-token
     *                   levelName: gigify-basic-kyc
     *                   expiresInSeconds: 600
     */
    .post(
        '/kyc/session',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(kycSessionSchema)
            .setHandler(createKycSession.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/kyc/status:
     *   get:
     *     tags: [User Identity]
     *     summary: Get the current user's latest KYC verification status
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Latest KYC status
     *         content:
     *           application/json:
     *             example:
     *               message: KYC Status Retrieved Successfully
     *               data:
     *                 verification:
     *                   id: 92000000-0000-0000-0000-000000000011
     *                   provider: sumsub
     *                   status: pending
     *                 isVerified: false
     *                 completed: false
     */
    .get(
        '/kyc/status',
        ControlBuilder.builder()
            .isPrivate()
            .setHandler(getKycStatus.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/kyc/webhooks/sumsub:
     *   post:
     *     tags: [User Identity]
     *     summary: Receive Sumsub verification events and reconcile user KYC state
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           example:
     *             type: applicantReviewed
     *             applicantId: sumsub-applicant-1
     *             reviewStatus: completed
     *             reviewResult:
     *               reviewAnswer: GREEN
     *     responses:
     *       200:
     *         description: Webhook processed
     *         content:
     *           application/json:
     *             example:
     *               message: Sumsub Webhook Processed Successfully
     *               data:
     *                 acknowledged: true
     *                 handled: true
     *                 eventType: applicantReviewed
     *                 verificationId: 92000000-0000-0000-0000-000000000011
     *                 status: approved
     */
    .post(
        '/kyc/webhooks/sumsub',
        ControlBuilder.builder()
            .setHandler(handleSumsubWebhook.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/settings/notifications:
     *   get:
     *     tags: [User Settings]
     *     summary: Get current notification preferences
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Notification preferences
     *         content:
     *           application/json:
     *             example:
     *               message: Notification Preferences Retrieved Successfully
     *               data:
     *                 emailEnabled: true
     *                 pushEnabled: true
     *                 marketingEnabled: false
     */
    .get(
        '/settings/notifications',
        ControlBuilder.builder()
            .isPrivate()
            .setHandler(getNotificationPreferences.handle)
            .handle(),
    )

    /**
     * @swagger
     * /user/settings/notifications:
     *   patch:
     *     tags: [User Settings]
     *     summary: Update push/email notification preferences
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               push_enabled: { type: boolean }
     *               payout_alerts: { type: boolean }
     *           example:
     *             emailEnabled: true
     *             pushEnabled: true
     *             marketingEnabled: false
     *             gigUpdates: true
     *     responses:
     *       200:
     *         description: Settings updated
     *         content:
     *           application/json:
     *             example:
     *               message: Notification Preferences Updated Successfully
     *               data:
     *                 emailEnabled: true
     *                 pushEnabled: true
     *                 marketingEnabled: false
     */
    .patch(
        '/settings/notifications',
        ControlBuilder.builder()
            .isPrivate()
            .setValidator(notificationPreferencesSchema)
            .setHandler(updateNotificationPreferences.handle)
            .handle(),
    );
