import { BadRequestError, ControllerArgs, HttpStatus, imageUploadService, UnAuthorizedError } from '@/core';

export class UploadFile {
    handle = async ({ files, request, query }: ControllerArgs) => {
        const user = request.user;
        if (!user?.id) throw new UnAuthorizedError('User not authenticated');

        if (!files || Object.keys(files).length === 0) {
            throw new BadRequestError('No files provided');
        }

        // express-fileupload puts files under their form-field names; each
        // value can be a single UploadedFile or an array. Flatten to one list.
        const allFiles = Object.values(files).flatMap((f) => (Array.isArray(f) ? f : [f]));
        if (allFiles.length === 0) throw new BadRequestError('No valid files found');

        const bucket = (query?.bucket as string) || 'avatars';
        const folder = query?.folder as string;

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

        const urls = results.map((r) => r.publicUrl).filter((url): url is string => Boolean(url));

        return {
            code: HttpStatus.CREATED,
            message: 'Files Uploaded Successfully',
            data: { urls, count: urls.length },
        };
    };
}

const uploadFile = new UploadFile();

export default uploadFile;
