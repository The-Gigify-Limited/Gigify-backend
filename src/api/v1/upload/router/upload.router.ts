import { Router } from 'express';
import { ControlBuilder } from '@/core';
import { uploadFile } from '../services';

export const uploadRouter = Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload file(s) to storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           default: avatars
 *           enum: [avatars, media, portfolios, IDUpload]
 *         description: |
 *           Storage bucket name. Known buckets:
 *             • `avatars` — profile images (5 MB, images only)
 *             • `media` — general uploads (100 MB, images/video/PDF)
 *             • `portfolios` — talent portfolio work (50 MB, images/video/PDF)
 *             • `IDUpload` — KYC / identity verification documents
 *               (20 MB, image/* + PDF, public-read)
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Folder path within bucket
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File(s) to upload
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Files Uploaded Successfully
 *               data:
 *                 urls:
 *                   - https://storage.gigify.app/avatars/file1.jpg
 *                 count: 1
 */
uploadRouter.post(
    '/',
    ControlBuilder.builder().isPrivate().setHandler(uploadFile.handle).handle(),
);
