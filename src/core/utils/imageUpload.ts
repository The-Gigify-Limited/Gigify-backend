import type { UploadApiResponse } from 'cloudinary';
import type { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import { cloudinary } from '../config';
import { ApiError, BadRequestError } from '../errors';

/**
 * Class: imageUploadService
 * -------------------------
 * This class provides methods for uploading and deleting images using Cloudinary.
 */
export class ImageUploadService {
    /**
     * Method: imageUpload
     * -------------------
     * Uploads an image to Cloudinary.
     *
     * @param folderName - A string representing the destination folder for the uploaded image.
     * @param file - The uploaded file to be processed.
     * @returns A Promise that resolves to the uploaded image information.
     */
    public async imageUpload(folderName: string, file: UploadedFile) {
        try {
            // Extract the image type from the file's mimetype
            const imageType = file.mimetype!.split('/')[0];

            // Check if the file is an image
            if (imageType !== 'image') {
                throw new BadRequestError('Enter valid image type');
            }

            // Extract the filename without extension
            // const fileNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'));

            // const fileName = `${fileNameWithoutExtension.toLocaleUpperCase()}-${this.generateRandom10DigitNumber()}`;

            const { tempFilePath } = file;

            // Upload the image to Cloudinary
            const fileInfo = await cloudinary.uploader.upload(tempFilePath, {
                // timeout: 12000000,
                // resource_type: "auto",
                // public_id: `Nithub/${folderName}/${fileName}`,
                chunk_size: 8000001,
                use_filename: true,
            });

            fs.unlinkSync(tempFilePath);

            delete fileInfo.api_key;

            return fileInfo;
        } catch (err: any) {
            if (err instanceof ApiError) {
                throw err;
            }
            throw new Error(err?.message);
        }
    }

    /**
     * Method: imageUpload
     * -------------------
     * Uploads Images in Bulk to Cloudinary.
     *
     * @param folderName - A string representing the destination folder for the uploaded image.
     * @param files - An Array of uploaded files to be processed.
     * @returns A Promise that resolves to the uploaded images information.
     */
    public async bulkUpload(folderName: string, files: UploadedFile[]): Promise<UploadApiResponse[]> {
        try {
            const response: UploadApiResponse[] = [];

            await Promise.all(
                files.map(async (file) => {
                    const fileInfo = await this.imageUpload(folderName, file);

                    response.push(fileInfo);
                }),
            );
            return response;
        } catch (err: any) {
            console.log(err);
            if (err instanceof ApiError) {
                throw err;
            }
            throw new Error(err.error.message);
        }
    }

    /**
     * Method: deleteImage
     * --------------------
     * Deletes an image from Cloudinary using its public ID.
     *
     * @param filePublicId - An array of public IDs of the images to be deleted.
     * @returns A Promise that resolves to the result of the image deletion operation.
     */
    public async deleteImage(filePublicId: string[]) {
        try {
            // Delete the file(s) using the public ID(s)
            const deletedFile = await cloudinary.api.delete_resources(filePublicId, {
                resource_type: 'image',
            });

            return deletedFile;
        } catch (err: any) {
            throw new Error(err.error.message);
        }
    }

    private generateRandom10DigitNumber = () => {
        return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    };
}

export const imageUploadService = new ImageUploadService();
