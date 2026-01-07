import { supabaseAdmin } from '@/core';
import { randomUUID } from 'crypto';
import type { UploadedFile } from 'express-fileupload';
import { ApiError, BadRequestError } from '../errors';
import { FileObject, RequestFileContents } from '../types';

interface UploadOptions {
    bucket: string;
    folder?: string;
    userId?: string;
    maxSizeMB?: number;
    allowedMimeTypes?: string[];
    cacheControl?: string;
    upsert?: boolean;
    public?: boolean;
}

interface UploadResult {
    path: string;
    publicUrl?: string;
    mimeType: string;
    size: number;
}

class ImageUploadService {
    public async upload(file: RequestFileContents, options: UploadOptions): Promise<UploadResult> {
        try {
            this.validateFile(file, options);

            const path = this.buildPath(file, options);

            const { error } = await supabaseAdmin.storage.from(options.bucket).upload(path, file.data, {
                contentType: file.mimetype,
                cacheControl: options.cacheControl ?? '3600',
                upsert: options.upsert ?? true,
            });

            if (error) throw error;

            const result: UploadResult = {
                path,
                mimeType: file.mimetype,
                size: file.size,
            };

            if (options.public !== false) {
                const { data } = supabaseAdmin.storage.from(options.bucket).getPublicUrl(path);

                result.publicUrl = data.publicUrl;
            }

            return result;
        } catch (err: any) {
            if (err instanceof ApiError || err instanceof BadRequestError) {
                throw err;
            }
            throw new Error(err?.message);
        }
    }

    public async bulkUpload(files: UploadedFile[], options: UploadOptions): Promise<UploadResult[]> {
        return Promise.all(files.map((file) => this.upload(file, options)));
    }

    public async delete(bucket: string, paths: string[]) {
        const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);
        if (error) throw error;
        return true;
    }

    private validateFile(file: UploadedFile, options: UploadOptions) {
        const { maxSizeMB = 10, allowedMimeTypes } = options;

        if (!file) {
            throw new BadRequestError('File is required');
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            throw new BadRequestError(`File must be less than ${maxSizeMB}MB`);
        }

        if (allowedMimeTypes && !this.isMimeAllowed(file.mimetype, allowedMimeTypes)) {
            throw new BadRequestError(`Unsupported file type: ${file.mimetype}`);
        }
    }

    private isMimeAllowed(mime: string, allowed: string[]) {
        return allowed.some((type) => (type.endsWith('/*') ? mime.startsWith(type.replace('/*', '')) : mime === type));
    }

    private buildPath(file: UploadedFile, options: UploadOptions) {
        const ext = file.name.split('.').pop();
        const fileName = `${randomUUID()}.${ext}`;

        return [options.folder, options.userId, fileName].filter(Boolean).join('/');
    }
}

export const imageUploadService = new ImageUploadService();
