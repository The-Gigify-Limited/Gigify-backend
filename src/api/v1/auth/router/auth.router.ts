import { ControlBuilder } from '@/core';
import { Router } from 'express';
import {
    // forgotPassword,
    login,
    logout,
    // refreshToken,
    register,
    setUserRole,
    verifyEmail,
} from '../services';
import {
    loginSchema,
    resendVerifyEmailMessageSchema,
    setUserRoleSchema,
    signUpSchema,
    verifyEmailValidateSchema,
} from './schema';

export const authRouter = Router();

authRouter
    /**
     * @swagger
     * /auth/login:
     *   post:
     *     tags: [Authentication]
     *     summary: Login user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 accessToken:
     *                   type: string
     *                 refreshToken:
     *                   type: string
     *                 user:
     *                   type: object
     *       401:
     *         description: Invalid credentials
     */
    .post(
        '/login',
        ControlBuilder.builder()
            .setValidator(loginSchema)
            .setHandler(login.handle)
            .handle(),
    )

    /**
     * @swagger
     * /auth/register:
     *   post:
     *     tags: [Authentication]
     *     summary: Register a new user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 format: password
     *     responses:
     *       201:
     *         description: User registered successfully
     *       400:
     *         description: Validation error
     */
    .post(
        '/register',
        ControlBuilder.builder()
            .setValidator(signUpSchema)
            .setHandler(register.handle)
            .handle(),
    )

    /**
     * @swagger
     * /auth/set-role:
     *   post:
     *     tags: [Authentication]
     *     summary: Set the Role a new user - Can be done only once
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *               - role
     *             properties:
     *               userId:
     *                 type: string
     *                 format: uuid
     *               role:
     *                 type: string
     *                 enum: [talent, employer]
     *     responses:
     *       201:
     *         description: User Role Set successfully
     *       400:
     *         description: Validation error
     */
    .post(
        '/set-role',
        ControlBuilder.builder()
            .setValidator(setUserRoleSchema)
            .setHandler(setUserRole.handle)
            .handle(),
    )

    /**
     * @swagger
     * /auth/verify-email:
     *   post:
     *     tags: [Authentication]
     *     summary: Verify user's email with OTP
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - otp
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User's email address
     *               otp:
     *                 type: string
     *                 description: 6-digit verification code sent to email
     *                 minLength: 6
     *                 maxLength: 6
     *     responses:
     *       200:
     *         description: Email verified successfully
     *       400:
     *         description: Invalid OTP or email
     */
    .post(
        '/verify-email',
        ControlBuilder.builder()
            .setValidator(verifyEmailValidateSchema)
            .setHandler(verifyEmail.verifyOtp)
            .handle(),
    )

    /**
     * @swagger
     * /auth/verify-email/resend:
     *   post:
     *     tags: [Authentication]
     *     summary: Resend verification email
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User's email address to resend OTP
     *     responses:
     *       200:
     *         description: Verification email resent successfully
     *       400:
     *         description: Invalid email or request
     */
    .post(
        '/verify-email/resend',
        ControlBuilder.builder()
            .setValidator(resendVerifyEmailMessageSchema)
            .setHandler(verifyEmail.resendEmail)
            .handle(),
    )

    // .post(
    //     '/forgot-password',
    //     ControlBuilder.builder()
    //         .setHandler(forgotPassword.handle)
    //         .setValidator(forgotPasswordSchema)
    //         .handle(),
    // )

    // .post(
    //     '/reset-password',
    //     ControlBuilder.builder()
    //         .setHandler(resetPassword.handle)
    //         .setValidator(resetPasswordSchema)
    //         .handle(),
    // )

    // .post(
    //     '/refresh-token',
    //     ControlBuilder.builder()
    //         .isPrivate()
    //         .setHandler(refreshToken.handle)
    //         .setValidator(refreshTokenSchema)
    //         .handle(),
    // )
    /**
     * @swagger
     * /auth/logout:
     *   get:
     *     tags: [Authentication]
     *     summary: Logout current user
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logout successful
     *       401:
     *         description: Unauthorized
     */
    .get('/logout', logout.handle);
