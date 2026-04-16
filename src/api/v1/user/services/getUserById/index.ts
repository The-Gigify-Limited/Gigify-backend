import { dispatch } from '@/app';
import { BadRequestError, ControllerArgs, HttpStatus } from '@/core';
import { GetUserParamsDto, User } from '~/user/interfaces';
import { UserRepository } from '~/user/repository';
import { TalentReview, TalentReviewSummary } from '~/talents/interfaces';

type BaseProfile = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    gender: string | null;
    email: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    phoneNumber: string | null;
    bannerImageUrl: string | null;
    profileImageUrl: string | null;
    reviews: TalentReview[];
    avgRating: number;
    totalRaters: number;
    eachRatingCount: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    onboarded: boolean;
    referral: string;
    isVerified: boolean;
    createdAt: string | null;
    updatedAt: string | null;
    status: string;
    role: string;
};

export class GetUserById {
    constructor(private readonly userRepository: UserRepository) {}

    private buildBaseProfile(
        user: User,
        reviewData: {
            reviews: TalentReview[];
            summary: TalentReviewSummary[];
        } | null,
    ): BaseProfile {
        const reviews = reviewData?.reviews ?? [];
        const summary = reviewData?.summary ?? [];

        const eachRatingCount = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        };

        let totalRaters = 0;
        let totalScore = 0;

        summary.forEach((item) => {
            eachRatingCount[item.rating as keyof typeof eachRatingCount] = item.count;
            totalRaters += item.count;
            totalScore += item.rating * item.count;
        });

        const avgRating = totalRaters > 0 ? totalScore / totalRaters : 0;

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            gender: user.gender,
            email: user.email,
            locationCity: user.locationCity,
            locationCountry: user.locationCountry,
            phoneNumber: user.phoneNumber,
            bannerImageUrl: null,
            profileImageUrl: user.profileImageUrl,
            reviews,
            avgRating,
            totalRaters,
            eachRatingCount,
            onboarded: (user.onboardingStep ?? 0) >= 3,
            referral: '',
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            status: user.status,
            role: user.role,
        };
    }

    handle = async (payload: ControllerArgs<GetUserParamsDto>) => {
        const { params, query } = payload;

        if (!params) throw new BadRequestError(`Invalid user ID`);

        const { id } = params;

        let user: User | null = null;

        const existingUser = await this.userRepository.findById(id);

        if (!existingUser) throw new BadRequestError('Invalid user ID');

        const convertedUser = this.userRepository.mapToCamelCase(existingUser);

        if (convertedUser) user = convertedUser;

        let baseProfile: BaseProfile | null = null;
        let talentProfile = undefined;
        let employerProfile = undefined;

        if (user) {
            const [reviewData] = await dispatch('talent:get-reviews', {
                talentId: id,
            });

            baseProfile = this.buildBaseProfile(user, reviewData ?? null);

            if (query?.full_profile) {
                if (user.role === 'talent') {
                    const [talent] = await dispatch('talent:get-talent-profile', { user_id: id });

                    if (talent) talentProfile = talent;
                }

                if (user.role === 'employer') {
                    const [employer] = await dispatch('employer:get-profile', { user_id: id });

                    if (employer) employerProfile = employer;
                }
            }
        }

        return {
            code: HttpStatus.OK,
            message: 'User Fetched Successfully',
            data: {
                user: baseProfile,
                employerProfile,
                talentProfile,
            },
        };
    };
}

const getUserById = new GetUserById(new UserRepository());

export default getUserById;
