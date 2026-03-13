import {
    ControlBuilder,
    authRateLimiter,
    passwordResetRateLimiter,
} from '@/core';
import { Router } from 'express';
import {
    exchangeGoogleAuthCode,
    forgotPassword,
    getGoogleAuthUrl,
    login,
    logout,
    refreshToken,
    register,
    requestPhoneOtp,
    setUserRole,
    verifyEmail,
    verifyPhoneOtp,
} from '../services';
import {
    forgotPasswordSchema,
    googleAuthCodeExchangeSchema,
    googleAuthUrlSchema,
    loginSchema,
    phoneOtpRequestSchema,
    phoneOtpVerifySchema,
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
     * /auth/phone/request-otp:
     *   post:
     *     tags: [Authentication]
     *     summary: Request a phone verification code for sign up or login
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - phoneNumber
     *             properties:
     *               phoneNumber:
     *                 type: string
     *                 description: Phone number in E.164 format
     *           example:
     *             phoneNumber: "+2348012345678"
     *     responses:
     *       200:
     *         description: Verification code sent
     *         content:
     *           application/json:
     *             example:
     *               message: Verification code sent successfully
     *               data:
     *                 phoneNumber: "+2348012345678"
     *                 channel: sms
     *                 resendAvailableInSeconds: 90
     *       429:
     *         description: Too many verification requests
     */
    .post(
        '/phone/request-otp',
        authRateLimiter,
        ControlBuilder.builder()
            .setValidator(phoneOtpRequestSchema)
            .setHandler(requestPhoneOtp.handle)
            .handle(),
    )

    /**
     * @swagger
     * /auth/phone/verify:
     *   post:
     *     tags: [Authentication]
     *     summary: Verify a phone OTP and sign the user in
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - phoneNumber
     *               - otp
     *             properties:
     *               phoneNumber:
     *                 type: string
     *                 description: Phone number in E.164 format
     *               otp:
     *                 type: string
     *                 description: 6-digit verification code sent by SMS
     *           example:
     *             phoneNumber: "+2348012345678"
     *             otp: "123456"
     *     responses:
     *       200:
     *         description: Phone number verified successfully
     *         content:
     *           application/json:
     *             example:
     *               message: Phone number verified successfully
     *               data:
     *                 user:
     *                   id: 20000000-0000-0000-0000-000000000031
     *                   phone: "+2348012345678"
     *                 session:
     *                   access_token: access-token
     *                   refresh_token: refresh-token
     *                 profile:
     *                   id: 20000000-0000-0000-0000-000000000031
     *                   phoneNumber: "+2348012345678"
     *       400:
     *         description: Invalid verification code
     */
    .post(
        '/phone/verify',
        authRateLimiter,
        ControlBuilder.builder()
            .setValidator(phoneOtpVerifySchema)
            .setHandler(verifyPhoneOtp.handle)
            .handle(),
    )

    /**
     * @swagger
     * /auth/oauth/google/url:
     *   post:
     *     tags: [Authentication]
     *     summary: Generate a Google authentication URL
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               redirectTo:
     *                 type: string
     *                 format: uri
     *                 description: Optional frontend callback URL
     *           example:
     *             redirectTo: https://app.gigify.com/auth/callback/google
     *     responses:
     *       200:
     *         description: Google authentication URL generated successfully
     *         content:
     *           application/json:
     *             example:
     *               message: Google authentication URL generated successfully
     *               data:
     *                 provider: google
     *                 url: https://example.supabase.co/auth/v1/authorize?provider=google
     *                 redirectTo: https://app.gigify.com/auth/callback/google
     */
    .post(
        '/oauth/google/url',
        ControlBuilder.builder()
            .setValidator(googleAuthUrlSchema)
            .setHandler(getGoogleAuthUrl.handle)
            .handle(),
    )

    /**
     * @swagger
     * /auth/oauth/google/exchange:
     *   post:
     *     tags: [Authentication]
     *     summary: Exchange a Google OAuth callback code for a Gigify session
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - code
     *             properties:
     *               code:
     *                 type: string
     *                 description: Authorization code returned from the Google callback redirect
     *           example:
     *             code: 4/0Adeu5BWm-example-google-callback-code
     *     responses:
     *       200:
     *         description: Google authentication completed successfully
     *         content:
     *           application/json:
     *             example:
     *               message: Google authentication completed successfully
     *               data:
     *                 user:
     *                   id: 20000000-0000-0000-0000-000000000041
     *                   email: talent.demo@gigify.app
     *                 session:
     *                   access_token: access-token
     *                   refresh_token: refresh-token
     *                 profile:
     *                   id: 20000000-0000-0000-0000-000000000041
     *                   email: talent.demo@gigify.app
     *                   onboardingStep: null
     */
    .post(
        '/oauth/google/exchange',
        authRateLimiter,
        ControlBuilder.builder()
            .setValidator(googleAuthCodeExchangeSchema)
            .setHandler(exchangeGoogleAuthCode.handle)
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
        ControlBuilder.builder().isPrivate().setHandler(logout.handle).handle(),
    );
