import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    applyToGig,
    createGig,
    createGigOffer,
    deleteGig,
    exploreGigs,
    getAllGigs,
    getGigApplications,
    getGigById,
    getGigCatalog,
    getGigDiscoveryFeed,
    getGigOffersForGig,
    getMyGigs,
    getMyGigOffers,
    getSavedGigs,
    hireTalent,
    removeSavedGig,
    reportTalent,
    saveGig,
    searchGigs,
    updateApplicationStatus,
    updateGig,
    updateGigOffer,
    updateGigStatus,
} from '../services';
import {
    applyToGigSchema,
    createGigSchema,
    createGigOfferSchema,
    discoveryFeedSchema,
    gigApplicationsSchema,
    gigFiltersSchema,
    gigIdSchema,
    gigOffersSchema,
    hireTalentSchema,
    myGigOffersSchema,
    myGigsSchema,
    reportTalentSchema,
    savedGigsSchema,
    updateApplicationStatusSchema,
    updateGigSchema,
    updateGigOfferSchema,
    updateGigStatusSchema,
} from './schema';

export const gigRouter = Router();

/**
 * @swagger
 * /gig/catalog:
 *   get:
 *     tags: [Gigs]
 *     summary: Get the service catalog for gigs
 *     responses:
 *       200:
 *         description: Service catalog
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Catalog Retrieved Successfully
 *               data:
 *                 - id: 40000000-0000-0000-0000-000000000001
 *                   name: DJ
 *                   category: Music
 */
gigRouter.get(
    '/catalog',
    ControlBuilder.builder().setHandler(getGigCatalog.handle).handle(),
);

/**
 * @swagger
 * /gig/explore:
 *   get:
 *     tags: [Gigs]
 *     summary: Explore open gigs with filters
 *     responses:
 *       200:
 *         description: Gig explore feed
 *         content:
 *           application/json:
 *             example:
 *               message: Gigs Retrieved Successfully
 *               data:
 *                 - id: 50000000-0000-0000-0000-000000000005
 *                   title: Afrobeat Night Drummer
 *                   budgetAmount: 180000
 *                   venueName: Lekki, Lagos, Nigeria
 *                   status: open
 */
gigRouter.get(
    '/explore',
    ControlBuilder.builder()
        .setValidator(gigFiltersSchema)
        .setHandler(exploreGigs.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/search:
 *   get:
 *     tags: [Gigs]
 *     summary: Search gigs with keyword and filter support
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Search Completed Successfully
 *               data:
 *                 - id: 50000000-0000-0000-0000-000000000001
 *                   title: Luxury Wedding Afterparty DJ
 *                   budgetAmount: 2200
 *                   currency: GBP
 */
gigRouter.get(
    '/search',
    ControlBuilder.builder()
        .setValidator(gigFiltersSchema)
        .setHandler(searchGigs.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/discovery/home:
 *   get:
 *     tags: [Gigs]
 *     summary: Get the personalized gig home feed
 *     description: Returns Figma-backed home sections like gigs near you, recommended gigs, gigs for you, active gigs, upcoming gigs, and received offers.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized discovery feed
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Discovery Feed Retrieved Successfully
 *               data:
 *                 nearYou:
 *                   - id: 50000000-0000-0000-0000-000000000005
 *                     title: Afrobeat Night Drummer
 *                     distanceKm: 6.8
 *                     isSaved: true
 *                 recommended:
 *                   - id: 50000000-0000-0000-0000-000000000012
 *                     title: Corporate Afterparty DJ
 *                 gigsForYou:
 *                   - id: 50000000-0000-0000-0000-000000000011
 *                     title: Abuja Wedding Band Lead
 *                 active: []
 *                 upcoming:
 *                   - application:
 *                       id: 60000000-0000-0000-0000-000000000002
 *                       status: hired
 *                     gig:
 *                       id: 50000000-0000-0000-0000-000000000002
 *                       title: Lagos Beach Wedding Sax Set
 *                 offers:
 *                   - id: 61000000-0000-0000-0000-000000000001
 *                     status: pending
 */
gigRouter.get(
    '/discovery/home',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(discoveryFeedSchema)
        .setHandler(getGigDiscoveryFeed.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/saved:
 *   get:
 *     tags: [Gigs]
 *     summary: Get the current user's saved gigs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved gigs
 *         content:
 *           application/json:
 *             example:
 *               message: Saved Gigs Retrieved Successfully
 *               data:
 *                 - id: 72000000-0000-0000-0000-000000000001
 *                   gigId: 50000000-0000-0000-0000-000000000005
 */
gigRouter.get(
    '/saved',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(savedGigsSchema)
        .setHandler(getSavedGigs.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/my-gigs/{status}:
 *   get:
 *     tags: [Gigs]
 *     summary: Get the current talent's gigs by lifecycle bucket
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Talent gig feed
 *         content:
 *           application/json:
 *             example:
 *               message: My Gigs Retrieved Successfully
 *               data:
 *                 - application:
 *                     id: 60000000-0000-0000-0000-000000000002
 *                     status: hired
 *                   gig:
 *                     id: 50000000-0000-0000-0000-000000000002
 *                     title: Lagos Beach Wedding Sax Set
 */
gigRouter.get(
    '/my-gigs/:status',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(myGigsSchema)
        .setHandler(getMyGigs.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/offers/me:
 *   get:
 *     tags: [Gig Offers]
 *     summary: Get the current user's gig offers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offer feed
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Offers Retrieved Successfully
 *               data:
 *                 - id: 61000000-0000-0000-0000-000000000001
 *                   status: pending
 *                   proposedRate: 180000
 *                   gig:
 *                     id: 50000000-0000-0000-0000-000000000005
 *                     title: Afrobeat Night Drummer
 */
gigRouter.get(
    '/offers/me',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(myGigOffersSchema)
        .setHandler(getMyGigOffers.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/save:
 *   post:
 *     tags: [Gigs]
 *     summary: Save a gig for later
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gig saved
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Saved Successfully
 *               data:
 *                 id: 72000000-0000-0000-0000-000000000001
 *                 userId: 20000000-0000-0000-0000-000000000001
 *                 gigId: 50000000-0000-0000-0000-000000000005
 */
gigRouter.post(
    '/:id/save',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(gigIdSchema)
        .setHandler(saveGig.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/save:
 *   delete:
 *     tags: [Gigs]
 *     summary: Remove a gig from the saved list
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gig removed from saved list
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Removed from Saved List Successfully
 */
gigRouter.delete(
    '/:id/save',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(gigIdSchema)
        .setHandler(removeSavedGig.handle)
        .handle(),
);

/**
 * @swagger
 * /gig:
 *   post:
 *     tags: [Gigs]
 *     summary: Create a new gig
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: Afrobeat Night Drummer
 *             description: Need a drummer with live-band discipline for an Afrobeat club night.
 *             budgetAmount: 180000
 *             currency: NGN
 *             gigDate: 2026-03-20T18:00:00.000Z
 *             serviceId: 40000000-0000-0000-0000-000000000003
 *             venueName: Lekki, Lagos, Nigeria
 *             locationLatitude: 6.4474
 *             locationLongitude: 3.472
 *             isRemote: false
 *             requiredTalentCount: 1
 *             gigType: club_night
 *             gigStartTime: "21:00"
 *             gigEndTime: "02:00"
 *             durationMinutes: 300
 *             isEquipmentRequired: false
 *             dressCode: all_black
 *             additionalNotes: Two set breaks. MC will cue you.
 *             displayImage: https://cdn.example.com/gigs/afrobeat-night.jpg
 *             gigLocation: Lekki, Lagos
 *             gigAddress: 12 Admiralty Way
 *             gigPostCode: "101231"
 *             skillRequired: Drummer
 *     responses:
 *       201:
 *         description: Gig created
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Created Successfully
 *               data:
 *                 id: 50000000-0000-0000-0000-000000000005
 *                 title: Afrobeat Night Drummer
 *                 status: open
 */
gigRouter.post(
    '/',
    ControlBuilder.builder()
        .only('employer')
        .setValidator(createGigSchema)
        .setHandler(createGig.handle)
        .handle(),
);

/**
 * @swagger
 * /gig:
 *   get:
 *     tags: [Gigs]
 *     summary: List gigs with optional filters
 *     responses:
 *       200:
 *         description: Gig list
 *         content:
 *           application/json:
 *             example:
 *               message: Gigs Retrieved Successfully
 *               data:
 *                 - id: 50000000-0000-0000-0000-000000000011
 *                   title: Abuja Wedding Band Lead
 *                   status: open
 */
gigRouter.get(
    '/',
    ControlBuilder.builder()
        .setValidator(gigFiltersSchema)
        .setHandler(getAllGigs.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/applications:
 *   get:
 *     tags: [Gigs]
 *     summary: List applications for a gig
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gig applications
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Applications Retrieved Successfully
 *               data:
 *                 - id: 60000000-0000-0000-0000-000000000006
 *                   talentId: 20000000-0000-0000-0000-000000000001
 *                   status: shortlisted
 */
gigRouter.get(
    '/:id/applications',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'id')
        .setValidator(gigApplicationsSchema)
        .setHandler(getGigApplications.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{gigId}/application/{applicationId}/status:
 *   patch:
 *     tags: [Gigs]
 *     summary: Employer shortlists or rejects a talent's application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: applicationId
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [shortlisted, rejected]
 *               employerNotes:
 *                 type: string
 *           example:
 *             status: shortlisted
 *             employerNotes: Great portfolio, booking for interview.
 *     responses:
 *       200:
 *         description: Application status updated
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Caller does not own the gig, or role is not employer
 *       409:
 *         description: Invalid transition (e.g. already rejected, already hired)
 */
gigRouter.patch(
    '/:gigId/application/:applicationId/status',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'gigId')
        .setValidator(updateApplicationStatusSchema)
        .setHandler(updateApplicationStatus.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/offers:
 *   get:
 *     tags: [Gig Offers]
 *     summary: List offers sent for a specific gig
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gig offers
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Offers Retrieved Successfully
 *               data:
 *                 - id: 61000000-0000-0000-0000-000000000001
 *                   talentId: 20000000-0000-0000-0000-000000000001
 *                   status: pending
 */
gigRouter.get(
    '/:id/offers',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'id')
        .setValidator(gigOffersSchema)
        .setHandler(getGigOffersForGig.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/offers:
 *   post:
 *     tags: [Gig Offers]
 *     summary: Send a direct offer to a talent for a gig
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             talentId: 20000000-0000-0000-0000-000000000001
 *             proposedRate: 180000
 *             currency: NGN
 *             message: We think your Afrobeat timing fits this room perfectly.
 *             expiresAt: 2026-03-17T18:00:00.000Z
 *     responses:
 *       201:
 *         description: Offer created
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Offer Created Successfully
 *               data:
 *                 id: 61000000-0000-0000-0000-000000000001
 *                 status: pending
 *                 talentId: 20000000-0000-0000-0000-000000000001
 */
gigRouter.post(
    '/:id/offers',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'id')
        .setValidator(createGigOfferSchema)
        .setHandler(createGigOffer.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/apply:
 *   post:
 *     tags: [Gigs]
 *     summary: Apply to a gig as a talent
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             proposalMessage: I can deliver a high-energy Afrobeat set and manage transitions smoothly.
 *             proposedRate: 210000
 *             proposedCurrency: NGN
 *     responses:
 *       201:
 *         description: Application submitted
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Application Submitted Successfully
 *               data:
 *                 id: 60000000-0000-0000-0000-000000000010
 *                 status: submitted
 */
gigRouter.post(
    '/:id/apply',
    ControlBuilder.builder()
        .only('talent')
        .setValidator(applyToGigSchema)
        .setHandler(applyToGig.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/status:
 *   patch:
 *     tags: [Gigs]
 *     summary: Update the lifecycle status of a gig
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: completed
 *             reason: Event finished successfully.
 *     responses:
 *       200:
 *         description: Gig status updated
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Status Updated Successfully
 *               data:
 *                 id: 50000000-0000-0000-0000-000000000007
 *                 status: completed
 */
gigRouter.patch(
    '/:id/status',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'id')
        .setValidator(updateGigStatusSchema)
        .setHandler(updateGigStatus.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/hire/{talentId}:
 *   post:
 *     tags: [Gigs]
 *     summary: Hire a talent for a gig
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             amount: 180000
 *             currency: NGN
 *             provider: manual
 *             paymentReference: PAY-GIG-002
 *     responses:
 *       200:
 *         description: Talent hired successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Hired Successfully
 *               data:
 *                 application:
 *                   id: 60000000-0000-0000-0000-000000000002
 *                   status: hired
 *                 gig:
 *                   id: 50000000-0000-0000-0000-000000000002
 *                   status: in_progress
 *                 payment:
 *                   id: 70000000-0000-0000-0000-000000000001
 *                   status: pending
 *                 remainingTalentSlots: 0
 */
gigRouter.post(
    '/:id/hire/:talentId',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'id')
        .setValidator(hireTalentSchema)
        .setHandler(hireTalent.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}/report-talent:
 *   post:
 *     tags: [Gigs]
 *     summary: Report the hired talent for a gig
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             talentId: 20000000-0000-0000-0000-000000000005
 *             category: professional_conduct
 *             reason: Talent arrived late to rehearsal and missed one briefing checkpoint.
 *     responses:
 *       201:
 *         description: Report submitted
 *         content:
 *           application/json:
 *             example:
 *               message: Talent Report Submitted Successfully
 *               data:
 *                 id: 93000000-0000-0000-0000-000000000001
 *                 status: open
 */
gigRouter.post(
    '/:id/report-talent',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'id')
        .setValidator(reportTalentSchema)
        .setHandler(reportTalent.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/offers/{offerId}:
 *   patch:
 *     tags: [Gig Offers]
 *     summary: Accept, decline, or withdraw a gig offer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: accepted
 *     responses:
 *       200:
 *         description: Offer updated
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Offer Updated Successfully
 *               data:
 *                 offer:
 *                   id: 61000000-0000-0000-0000-000000000003
 *                   status: accepted
 *                 payment:
 *                   id: 70000000-0000-0000-0000-000000000003
 *                   status: pending
 */
gigRouter.patch(
    '/offers/:offerId',
    ControlBuilder.builder()
        .isPrivate()
        .setValidator(updateGigOfferSchema)
        .setHandler(updateGigOffer.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}:
 *   get:
 *     tags: [Gigs]
 *     summary: Get gig details
 *     responses:
 *       200:
 *         description: Gig details
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Retrieved Successfully
 *               data:
 *                 id: 50000000-0000-0000-0000-000000000002
 *                 title: Lagos Beach Wedding Sax Set
 *                 remainingTalentSlots: 0
 *                 isSaved: false
 *                 myApplication:
 *                   id: 60000000-0000-0000-0000-000000000002
 *                   status: hired
 */
gigRouter.get(
    '/:id',
    ControlBuilder.builder()
        .setValidator(gigIdSchema)
        .setHandler(getGigById.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}:
 *   patch:
 *     tags: [Gigs]
 *     summary: Update a gig
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: Afrobeat Night Drummer
 *             budgetAmount: 200000
 *             requiredTalentCount: 2
 *             gigType: club_night
 *             gigStartTime: "21:00"
 *             gigEndTime: "02:00"
 *             durationMinutes: 300
 *             isEquipmentRequired: false
 *             dressCode: all_black
 *             additionalNotes: Two set breaks. MC will cue you.
 *             displayImage: https://cdn.example.com/gigs/afrobeat-night.jpg
 *             gigLocation: Lekki, Lagos
 *             gigAddress: 12 Admiralty Way
 *             gigPostCode: "101231"
 *             skillRequired: Drummer
 *     responses:
 *       200:
 *         description: Gig updated
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Updated Successfully
 *               data:
 *                 id: 50000000-0000-0000-0000-000000000005
 *                 budgetAmount: 200000
 *                 requiredTalentCount: 2
 */
gigRouter.patch(
    '/:id',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'id')
        .setValidator(updateGigSchema)
        .setHandler(updateGig.handle)
        .handle(),
);

/**
 * @swagger
 * /gig/{id}:
 *   delete:
 *     tags: [Gigs]
 *     summary: Delete a gig
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Gig deleted
 *         content:
 *           application/json:
 *             example:
 *               message: Gig Deleted Successfully
 */
gigRouter.delete(
    '/:id',
    ControlBuilder.builder()
        .only('employer')
        .checkResourceOwnership('gig', 'id')
        .setValidator(gigIdSchema)
        .setHandler(deleteGig.handle)
        .handle(),
);
