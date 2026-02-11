import { ControllerArgs, HttpStatus, imageUploadService, UnAuthorizedError } from '@/core';
import { TalentPortfolioRepository, TalentRepository } from '~/talents/repository';

export class UpdateTalentPortfolioById {
    constructor(private readonly talentPortfolioRepository: TalentPortfolioRepository, private readonly talentRepository: TalentRepository) {}

    handle = async (payload: ControllerArgs) => {
        const { files, request } = payload;

        const user = request.user;

        if (!user || !user.id) throw new UnAuthorizedError(`No User Found!`);

        const talent = await this.talentRepository.findByUserId(user.id);

        if (!talent || !talent.id) throw new UnAuthorizedError(`Talent not found! You're not registered as a talent.`);

        const uploadedUrls: string[] = [];

        if (files?.talent_portfolios) {
            const allFiles = Array.isArray(files.talent_portfolios) ? files.talent_portfolios : [files.talent_portfolios];

            const images = allFiles.filter((f) => f.mimetype.startsWith('image/'));
            const videos = allFiles.filter((f) => f.mimetype.startsWith('video/'));

            // Upload images sequentially
            for (const img of images) {
                const { publicUrl } = await imageUploadService.upload(img, {
                    bucket: 'avatars',
                    folder: 'talent_portfolios/images',
                    userId: user.id,
                    maxSizeMB: 50,
                    allowedMimeTypes: ['image/*'],
                });

                publicUrl && uploadedUrls.push(publicUrl);
            }

            const imageResults = await Promise.all(
                images.map((image) =>
                    imageUploadService.upload(image, {
                        bucket: 'avatars',
                        folder: 'talent_portfolios/images',
                        userId: user.id,
                        maxSizeMB: 50,
                        allowedMimeTypes: ['image/*'],
                    }),
                ),
            );

            uploadedUrls.push(...imageResults.map((r) => r.publicUrl).filter((url): url is string => Boolean(url)));

            // Upload videos or large files in parallel
            const videoResults = await Promise.all(
                videos.map((video) =>
                    imageUploadService.upload(video, {
                        bucket: 'avatars',
                        folder: 'talent_portfolios/videos',
                        userId: user.id,
                        maxSizeMB: 500, // or any large limit
                        allowedMimeTypes: ['video/*'],
                    }),
                ),
            );
            uploadedUrls.push(...videoResults.map((r) => r.publicUrl).filter((url): url is string => Boolean(url)));
        }
        const response = await this.talentPortfolioRepository.createTalentPortfolios(talent.id, uploadedUrls);

        return {
            code: HttpStatus.CREATED,
            message: 'Talent Portfolios Created Successfully',
            data: response,
        };
    };
}

const updateTalentPortfolioById = new UpdateTalentPortfolioById(new TalentPortfolioRepository(), new TalentRepository());

export default updateTalentPortfolioById;
