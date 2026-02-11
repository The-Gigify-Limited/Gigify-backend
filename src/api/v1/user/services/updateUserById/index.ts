import { BadRequestError, ControllerArgs, HttpStatus, imageUploadService } from '@/core';
import { UpdateUserDto } from '~/user/interfaces';
import { UserRepository } from '~/user/repository';

export class UpdateUserById {
    constructor(private readonly userRepository: UserRepository) {}

    handle = async (payload: ControllerArgs<UpdateUserDto>) => {
        const { params, files, input } = payload;

        if (!params?.id) throw new BadRequestError(`No User ID Found!`);

        if (files?.profileImage) {
            const image = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage;

            const { publicUrl: public_url } = await imageUploadService.upload(image, {
                bucket: 'avatars',
                folder: 'profiles',
                userId: params.id,
                maxSizeMB: 50,
                allowedMimeTypes: ['image/*'],
            });

            input.profileImageUrl = public_url;
        }

        const { id } = params;

        const updatedUser = await this.userRepository.updateById(id, input);

        return {
            code: HttpStatus.OK,
            message: 'User Updated Successfully',
            data: updatedUser,
        };
    };
}

const getUserById = new UpdateUserById(new UserRepository());

export default getUserById;
