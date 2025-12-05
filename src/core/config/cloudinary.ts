import cloud from 'cloudinary';

const cloudinary = cloud.v2;

import { config as configObj } from './config';

cloudinary.config({
    cloud_name: configObj.cloudinary.cloudName,
    api_key: configObj.cloudinary.apiKey,
    api_secret: configObj.cloudinary.apiSecret,
});

export { cloudinary };
