import { BadRequestError, ControllerArgs, HttpStatus, imageUploadService, UnAuthorizedError } from '@/core';

export class UploadFile {
    handle = async (payload: ControllerArgs) => {
        const { files, request, query } = payload;

        const user = request.user;

        if (!user || !user.id) throw new UnAuthorizedError('No User Found!');

        const bucket = (query?.bucket as string) || 'avatars';
        const folder = query?.folder as string;

        const uploadedUrls: string[] = [];

        if (!files || Object.keys(files).length === 0) {
            throw new BadRequestError('No files provided');
        }

        const allFiles = [];
        for (const key in files) {
            const fileValue = files[key];
            if (Array.isArray(fileValue)) {
                allFiles.push(...fileValue);
            } else {
                allFiles.push(fileValue);
            }
        }

        if (allFiles.length === 0) {
            throw new BadRequestError('No valid files found');
        }

        const results = await Promise.all(
            allFiles.map((file) =>
                imageUploadService.upload(file, {
                    bucket,
                    folder,
                    userId: user.id,
                    maxSizeMB: 100,
                    allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
                }),
            ),
        );

        uploadedUrls.push(...results.map((r) => r.publicUrl).filter((url): url is string => Boolean(url)));

        return {
            code: HttpStatus.CREATED,
            message: 'Files Uploaded Successfully',
            data: {
                urls: uploadedUrls,
                count: uploadedUrls.length,
            },
        };
    };
}

const uploadFile = new UploadFile();

export default uploadFile;
