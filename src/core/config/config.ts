import * as dotenv from 'dotenv';
import Joi from 'joi';
import type { Dialect } from 'sequelize';

dotenv.config();

type INodeEnv = 'development' | 'production' | 'staging';

// Define validation schema for environment variables
const envSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('development', 'production', 'staging').required(),
        PORT: Joi.number().required(),

        ACCESS_TOKEN_SECRET: Joi.string().required(),
        ACCESS_TOKEN_EXP: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().allow('').required(),
        REFRESH_TOKEN_EXP: Joi.string().required(),
        ENCRYPTOR_SECRET_KEY: Joi.string().required(),

        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        SERVER_API_URL: Joi.string().required(),

        DATABASE_NAME: Joi.string().required(),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().allow('').required(),
        DATABASE_TYPE: Joi.string().required(),

        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.string().required(),
        REDIS_PASSWORD: Joi.string().allow('').required(),

        CLOUDINARY_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),

        SENDGRID_API_KEY: Joi.string().required(),
        SENDGRID_EMAIL: Joi.string().required(),

        TWILIO_SID: Joi.string().required(),
        TWILIO_AUTH_TOKEN: Joi.string().required(),
        TWILIO_PHONE_NUMBER: Joi.number().required(),

        DEFAULT_EXTENSION_AGENT_PASSWORD: Joi.string().required(),

        PAYSTACK_SECRET_KEY: Joi.string().required(),

        FRONTEND_LIVE_ORIGIN: Joi.string().required(),
    })
    .unknown();

// Validate environment variables against the schema
const { value: validatedEnvVars, error: validationError } = envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

// Throw an error if validation fails
if (validationError) {
    throw new Error(`Config validation error: ${validationError.message}`);
}

export const config = Object.freeze({
    port: validatedEnvVars.PORT,
    appEnvironment: validatedEnvVars.NODE_ENV as INodeEnv,

    auth: {
        accessTokenSecret: validatedEnvVars.ACCESS_TOKEN_SECRET,
        accessTokenExpiresIn: validatedEnvVars.ACCESS_TOKEN_EXP,
        refreshTokenSecret: validatedEnvVars.REFRESH_TOKEN_SECRET,
        refreshTokenExpiresIn: validatedEnvVars.REFRESH_TOKEN_EXP,
        encryptorSecretKey: validatedEnvVars.ENCRYPTOR_SECRET_KEY,
    },

    google: {
        clientID: validatedEnvVars.GOOGLE_CLIENT_ID,
        clientSecret: validatedEnvVars.GOOGLE_CLIENT_SECRET,
        callbackURL: `${validatedEnvVars.SERVER_API_URL}/auth/google/callback`,
    },

    db: {
        dbUser: validatedEnvVars.DATABASE_USER,
        dbPassword: validatedEnvVars.DATABASE_PASSWORD,
        dbHost: validatedEnvVars.DATABASE_HOST,
        dbName: validatedEnvVars.DATABASE_NAME,
        dbType: validatedEnvVars.DATABASE_TYPE as Dialect,
    },

    cache: {
        port: parseInt(process.env.REDIS_PORT!),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
    },

    cloudinary: {
        cloudName: validatedEnvVars.CLOUDINARY_NAME,
        apiKey: validatedEnvVars.CLOUDINARY_API_KEY,
        apiSecret: validatedEnvVars.CLOUDINARY_API_SECRET,
        assetsFolder: 'GREENHURB_ASSETS',
    },

    sendGrid: {
        sendGridApikey: validatedEnvVars.SENDGRID_API_KEY,
        sendgrid_email: validatedEnvVars.SENDGRID_EMAIL,
    },

    twilio: {
        twilio_sid: validatedEnvVars.TWILIO_SID,
        twilio_auth_token: validatedEnvVars.TWILIO_AUTH_TOKEN,
        twilio_phone_number: validatedEnvVars.TWILIO_PHONE_NUMBER,
    },

    frontendOriginUrl: validatedEnvVars.FRONTEND_LIVE_ORIGIN,



    passwords: {
        extensionAgent: validatedEnvVars.DEFAULT_EXTENSION_AGENT_PASSWORD,
    },
});
