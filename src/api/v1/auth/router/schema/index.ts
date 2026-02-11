import Joi from 'joi';

const signUpSchema = {
    inputSchema: Joi.object().keys({
        email: Joi.string()
            .required()
            .email({ tlds: { allow: false } })
            .label('Valid email is required'),

        password: Joi.string()
            .min(8)
            .required()
            .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/)
            .label(
                'Password is required and must be at least 8 characters. It should include at least one uppercase letter, one lowercase letter, one digit, and one special character (@#$%^&+=!).',
            ),
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
        code: Joi.string().length(6).required(),
        password: Joi.string().required(),
        email: Joi.string()
            .required()
            .email({ tlds: { allow: false } }),
    }),
};

const refreshTokenSchema = {
    inputSchema: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

export {
    forgotPasswordSchema,
    loginSchema,
    refreshTokenSchema,
    resendVerifyEmailMessageSchema,
    resetPasswordSchema,
    signUpSchema,
    verifyEmailValidateSchema,
    setUserRoleSchema,
};
