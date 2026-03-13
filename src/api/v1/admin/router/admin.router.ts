import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    broadcastNotification,
    getAdminAuditLogs,
    getAdminDashboard,
    getAdminGigs,
    getAdminIdentityVerifications,
    getAdminPayoutRequests,
    getAdminReports,
    getAdminUsers,
    updateAdminGigStatus,
    updateAdminIdentityVerification,
    updateAdminPayoutRequest,
    updateAdminReport,
    updateAdminUserStatus,
} from '../services';
import {
    adminAuditLogsQuerySchema,
    adminBroadcastNotificationSchema,
    adminGigStatusSchema,
    adminGigsQuerySchema,
    adminIdentityVerificationQuerySchema,
    adminIdentityVerificationStatusSchema,
    adminPayoutRequestsQuerySchema,
    adminPayoutRequestStatusSchema,
    adminReportsQuerySchema,
    adminReportStatusSchema,
    adminUsersQuerySchema,
    adminUserStatusSchema,
} from './schema';

export const adminRouter = Router();

adminRouter.use((req, _res, next) => next());

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Dashboard Retrieved Successfully
 *               data:
 *                 users:
 *                   total: 124
 *                   active: 118
 *                 gigs:
 *                   total: 46
 *                   open: 21
 *                 operations:
 *                   openReports: 3
 *                   pendingPayoutRequests: 2
 */
adminRouter.get('/dashboard', ControlBuilder.builder().only('admin').setHandler(getAdminDashboard.handle).handle());

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users for administration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User list
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Users Retrieved Successfully
 *               data:
 *                 - id: 20000000-0000-0000-0000-000000000001
 *                   email: dj.maxell@test.com
 *                   role: talent
 *                   status: active
 */
adminRouter.get('/users', ControlBuilder.builder().only('admin').setValidator(adminUsersQuerySchema).setHandler(getAdminUsers.handle).handle());

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Suspend or reactivate a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: suspended
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             example:
 *               message: Admin User Status Updated Successfully
 *               data:
 *                 id: 20000000-0000-0000-0000-000000000003
 *                 status: suspended
 */
adminRouter.patch('/users/:id/status', ControlBuilder.builder().only('admin').setValidator(adminUserStatusSchema).setHandler(updateAdminUserStatus.handle).handle());

/**
 * @swagger
 * /admin/gigs:
 *   get:
 *     tags: [Admin]
 *     summary: List gigs for moderation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gig list
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Gigs Retrieved Successfully
 *               data:
 *                 - id: 50000000-0000-0000-0000-000000000005
 *                   title: Afrobeat Night Drummer
 *                   status: open
 */
adminRouter.get('/gigs', ControlBuilder.builder().only('admin').setValidator(adminGigsQuerySchema).setHandler(getAdminGigs.handle).handle());

/**
 * @swagger
 * /admin/gigs/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update gig status as an administrator
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: cancelled
 *             reason: Duplicate or policy-violating listing
 *     responses:
 *       200:
 *         description: Gig updated
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Gig Status Updated Successfully
 *               data:
 *                 id: 50000000-0000-0000-0000-000000000005
 *                 status: cancelled
 */
adminRouter.patch('/gigs/:id/status', ControlBuilder.builder().only('admin').setValidator(adminGigStatusSchema).setHandler(updateAdminGigStatus.handle).handle());

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: List moderation reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report list
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Reports Retrieved Successfully
 *               data:
 *                 - id: 93000000-0000-0000-0000-000000000001
 *                   status: open
 *                   category: professional_conduct
 */
adminRouter.get('/reports', ControlBuilder.builder().only('admin').setValidator(adminReportsQuerySchema).setHandler(getAdminReports.handle).handle());

/**
 * @swagger
 * /admin/reports/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Review or resolve a report
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: resolved
 *             resolutionNote: Resolved after reviewing event evidence.
 *     responses:
 *       200:
 *         description: Report updated
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Report Updated Successfully
 *               data:
 *                 id: 93000000-0000-0000-0000-000000000001
 *                 status: resolved
 */
adminRouter.patch('/reports/:id', ControlBuilder.builder().only('admin').setValidator(adminReportStatusSchema).setHandler(updateAdminReport.handle).handle());

/**
 * @swagger
 * /admin/payout-requests:
 *   get:
 *     tags: [Admin]
 *     summary: List payout requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout request list
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Payout Requests Retrieved Successfully
 *               data:
 *                 - id: 71000000-0000-0000-0000-000000000001
 *                   amount: 90000
 *                   currency: NGN
 *                   status: requested
 */
adminRouter.get(
    '/payout-requests',
    ControlBuilder.builder().only('admin').setValidator(adminPayoutRequestsQuerySchema).setHandler(getAdminPayoutRequests.handle).handle(),
);

/**
 * @swagger
 * /admin/payout-requests/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a payout request status
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: approved
 *     responses:
 *       200:
 *         description: Payout request updated
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Payout Request Updated Successfully
 *               data:
 *                 id: 71000000-0000-0000-0000-000000000001
 *                 status: approved
 */
adminRouter.patch(
    '/payout-requests/:id',
    ControlBuilder.builder().only('admin').setValidator(adminPayoutRequestStatusSchema).setHandler(updateAdminPayoutRequest.handle).handle(),
);

/**
 * @swagger
 * /admin/identity-verifications:
 *   get:
 *     tags: [Admin]
 *     summary: List submitted identity verifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification list
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Identity Verifications Retrieved Successfully
 *               data:
 *                 - id: 92000000-0000-0000-0000-000000000001
 *                   userId: 20000000-0000-0000-0000-000000000001
 *                   status: pending
 */
adminRouter.get(
    '/identity-verifications',
    ControlBuilder.builder().only('admin').setValidator(adminIdentityVerificationQuerySchema).setHandler(getAdminIdentityVerifications.handle).handle(),
);

/**
 * @swagger
 * /admin/identity-verifications/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Review an identity verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: approved
 *             notes: Identity documents matched submitted profile.
 *     responses:
 *       200:
 *         description: Verification updated
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Identity Verification Updated Successfully
 *               data:
 *                 id: 92000000-0000-0000-0000-000000000001
 *                 status: approved
 */
adminRouter.patch(
    '/identity-verifications/:id',
    ControlBuilder.builder().only('admin').setValidator(adminIdentityVerificationStatusSchema).setHandler(updateAdminIdentityVerification.handle).handle(),
);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: View security and moderation audit logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit log list
 *         content:
 *           application/json:
 *             example:
 *               message: Admin Audit Logs Retrieved Successfully
 *               data:
 *                 - id: 94000000-0000-0000-0000-000000000001
 *                   action: admin_report_reviewed
 *                   resourceType: report
 *                   result: success
 */
adminRouter.get('/audit-logs', ControlBuilder.builder().only('admin').setValidator(adminAuditLogsQuerySchema).setHandler(getAdminAuditLogs.handle).handle());

/**
 * @swagger
 * /admin/notifications/broadcast:
 *   post:
 *     tags: [Admin]
 *     summary: Broadcast an in-app notification to matching users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: Platform maintenance notice
 *             message: Scheduled maintenance starts at 11:00 PM UTC.
 *             type: marketing
 *             role: talent
 *             channel: in_app
 *     responses:
 *       200:
 *         description: Broadcast delivered
 *         content:
 *           application/json:
 *             example:
 *               message: Broadcast Notification Sent Successfully
 *               data:
 *                 recipients: 48
 */
adminRouter.post(
    '/notifications/broadcast',
    ControlBuilder.builder().only('admin').setValidator(adminBroadcastNotificationSchema).setHandler(broadcastNotification.handle).handle(),
);
