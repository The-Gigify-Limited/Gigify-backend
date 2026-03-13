import { ControlBuilder, authRateLimiter, passwordResetRateLimiter } from '@/core';
import { Router } from 'express';
import {
    forgotPassword,
    login,
    logout,
    refreshToken,
    register,
    setUserRole,
    verifyEmail,
} from '../services';
import {
    forgotPasswordSchema,
    loginSchema,
    refreshTokenSchema,
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
     *           example:
     *             email: talent.demo@gigify.app
     *             password: StrongPassword123!
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
     *             example:
     *               message: Login successful
     *               data:
     *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token
     *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token
     *                 user:
     *                   id: 20000000-0000-0000-0000-000000000001
     *                   email: talent.demo@gigify.app
     *                   role: talent
     *       401:
     *         description: Invalid credentials
     */
    .post(
        '/login',
        authRateLimiter,
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
     *           example:
     *             email: talent.demo@gigify.app
     *             password: StrongPassword123!
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             example:
     *               message: User registered successfully
     *               data:
     *                 user:
     *                   id: 20000000-0000-0000-0000-000000000021
     *                   email: talent.demo@gigify.app
     *                   role: null
     *       400:
     *         description: Validation error
     */
    .post(
        '/register',
        authRateLimiter,
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
     *           example:
     *             userId: 20000000-0000-0000-0000-000000000021
     *             role: talent
     *     responses:
     *       201:
     *         description: User Role Set successfully
     *         content:
     *           application/json:
     *             example:
     *               message: User Role Set successfully
     *               data:
     *                 id: 20000000-0000-0000-0000-000000000021
     *                 role: talent
     *                 onboardingStep: 1
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
     *           example:
     *             email: talent.demo@gigify.app
     *             otp: "123456"
     *     responses:
     *       200:
     *         description: Email verified successfully
     *         content:
     *           application/json:
     *             example:
     *               message: Email verified successfully
     *               data:
     *                 verified: true
     *                 email: talent.demo@gigify.app
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
     *           example:
     *             email: talent.demo@gigify.app
     *     responses:
     *       200:
     *         description: Verification email resent successfully
     *         content:
     *           application/json:
     *             example:
     *               message: Verification email resent successfully
     *               data:
     *                 email: talent.demo@gigify.app
     *       400:
     *         description: Invalid email or request
     */
    .post(
        '/verify-email/resend',
        authRateLimiter,
        ControlBuilder.builder()
            .setValidator(resendVerifyEmailMessageSchema)
            .setHandler(verifyEmail.resendEmail)
            .handle(),
    )

    /**
     * @swagger
     * /auth/forgot-password:
     *   post:
     *     tags: [Authentication]
     *     summary: Send a password recovery email
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
     *           example:
     *             email: talent.demo@gigify.app
     *     responses:
     *       200:
     *         description: Password recovery instructions accepted
     *         content:
     *           application/json:
     *             example:
     *               message: Password recovery instructions accepted
     *               data:
     *                 email: talent.demo@gigify.app
     *       429:
     *         description: Too many password reset requests
     */
    .post(
        '/forgot-password',
        passwordResetRateLimiter,
        ControlBuilder.builder()
            .setHandler(forgotPassword.handle)
            .setValidator(forgotPasswordSchema)
            .handle(),
    )

    // .post(
    //     '/reset-password',
    //     ControlBuilder.builder()
    //         .setHandler(resetPassword.handle)
    //         .setValidator(resetPasswordSchema)
    //         .handle(),
    // )

    /**
     * @swagger
     * /auth/refresh-token:
     *   post:
     *     tags: [Authentication]
     *     summary: Refresh access token using refresh token
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - refreshToken
     *             properties:
     *               refreshToken:
     *                 type: string
     *                 description: Valid refresh token from previous login
     *           example:
     *             refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token
     *     responses:
     *       200:
     *         description: Token refreshed successfully
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
     *             example:
     *               message: Token refreshed successfully
     *               data:
     *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new.access.token
     *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new.refresh.token
     *                 user:
     *                   id: 20000000-0000-0000-0000-000000000001
     *                   email: talent.demo@gigify.app
     *                   role: talent
     *       400:
     *         description: Refresh token is required
     *       401:
     *         description: Invalid or expired refresh token
     */
    .post(
        '/refresh-token',
        ControlBuilder.builder()
            .setValidator(refreshTokenSchema)
            .setHandler(refreshToken.handle)
            .handle(),
    )

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     tags: [Authentication]
     *     summary: Logout current user
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logout successful
     *         content:
     *           application/json:
     *             example:
     *               message: Logout successful
     *               data:
     *                 loggedOut: true
     *       401:
     *         description: Unauthorized
     */
    .post(
        '/logout',
        ControlBuilder.builder()
            .isPrivate()
            .setHandler(logout.handle)
            .handle(),
    );
