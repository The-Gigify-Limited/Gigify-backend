import Joi from 'joi';

const passwordStrengthPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const passwordSchema = Joi.string().min(8).pattern(passwordStrengthPattern, 'password-strength').required().messages({
    'string.empty': 'Password is required.',
    'string.min': 'Password must be at least 8 characters long.',
    'string.pattern.name': 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
    'any.required': 'Password is required.',
});

const signUpSchema = {
    inputSchema: Joi.object().keys({
        email: Joi.string()
            .required()
            .email({ tlds: { allow: false } })
            .label('Valid email is required'),

        password: passwordSchema,
    }),
};

const setUserRoleSchema = {
    inputSchema: Joi.object().keys({
        userId: Joi.string().uuid().required().label('User Id is Required'),
        role: Joi.string().valid('employer', 'talent').required().label('Role is required and must be either employer or talent'),
    }),
};

const loginSchema = {
    inputSchema: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
    }),
};

const phoneOtpRequestSchema = {
    inputSchema: Joi.object().keys({
        phoneNumber: Joi.string()
            .pattern(/^\+[1-9]\d{7,14}$/)
            .required()
            .label('Phone number is required in E.164 format, for example +2348012345678.'),
    }),
};

const phoneOtpVerifySchema = {
    inputSchema: Joi.object().keys({
        phoneNumber: Joi.string()
            .pattern(/^\+[1-9]\d{7,14}$/)
            .required()
            .label('Phone number is required in E.164 format, for example +2348012345678.'),
        otp: Joi.string()
            .pattern(/^\d{6}$/)
            .required()
            .label('A valid 6-digit OTP code is required'),
    }),
};

const googleAuthUrlSchema = {
    inputSchema: Joi.object().keys({
        redirectTo: Joi.string().uri().optional(),
    }),
};

const googleAuthCodeExchangeSchema = {
    inputSchema: Joi.object().keys({
        code: Joi.string().min(10).required(),
    }),
};

const resendVerifyEmailMessageSchema = {
    inputSchema: Joi.object().keys({
        email: Joi.string()
            .required()
            .email({ tlds: { allow: false } }),
    }),
};

const verifyEmailValidateSchema = {
    inputSchema: Joi.object().keys({
        otp: Joi.string().required(),

        email: Joi.string()
            .required()
            .email({ tlds: { allow: false } }),
    }),
};

const forgotPasswordSchema = {
    inputSchema: Joi.object().keys({
        email: Joi.string()
            .required()
            .email({ tlds: { allow: false } }),
    }),
};

const resetPasswordSchema = {
    inputSchema: Joi.object().keys({
        password: passwordSchema,
    }),
};

const refreshTokenSchema = {
    inputSchema: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

export {
    forgotPasswordSchema,
    googleAuthCodeExchangeSchema,
    googleAuthUrlSchema,
    loginSchema,
    phoneOtpRequestSchema,
    phoneOtpVerifySchema,
    refreshTokenSchema,
    resendVerifyEmailMessageSchema,
    resetPasswordSchema,
    signUpSchema,
    verifyEmailValidateSchema,
    setUserRoleSchema,
};
