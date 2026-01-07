import * as dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

type INodeEnv = 'development' | 'production' | 'staging';

// Define validation schema for environment variables
const envSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('development', 'production', 'staging').required(),
        PORT: Joi.number().required(),

        SUPABASE_URL: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),

        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.string().required(),
        REDIS_PASSWORD: Joi.string().allow('').required(),

        SENDGRID_API_KEY: Joi.string().required(),
        SENDGRID_EMAIL: Joi.string().required(),

        TWILIO_SID: Joi.string().required(),
        TWILIO_AUTH_TOKEN: Joi.string().required(),
        TWILIO_PHONE_NUMBER: Joi.number().required(),
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

    db: {
        supabaseUrl: validatedEnvVars.SUPABASE_URL,
        supabaseKey: validatedEnvVars.SUPABASE_SERVICE_ROLE_KEY,
        supabaseAnonKey: validatedEnvVars.SUPABASE_ANON_KEY,
    },

    cache: {
        port: parseInt(process.env.REDIS_PORT!),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
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
});
