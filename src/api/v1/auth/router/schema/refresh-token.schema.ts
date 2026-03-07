import Joi from 'joi';

export const refreshTokenSchema = {
    inputSchema: Joi.object({
        refreshToken: Joi.string().required().messages({
            'string.empty': 'Refresh token cannot be empty',
            'any.required': 'Refresh token is required',
        }),
    }),
};
