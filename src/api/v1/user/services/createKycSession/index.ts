import { ControllerArgs, HttpStatus, RouteNotFoundError, ServerError, UnAuthorizedError } from '@/core';
import { CreateKycSessionDto } from '../../interfaces';
import { IdentityVerificationRepository, UserRepository } from '../../repository';
import { createSumsubApplicant, createSumsubSdkAccessToken, getSumsubApplicantByExternalUserId } from '../../utils/sumsub';

export class CreateKycSession {
    constructor(private readonly identityVerificationRepository: IdentityVerificationRepository, private readonly userRepository: UserRepository) {}

    handle = async ({ input, request }: ControllerArgs<CreateKycSessionDto>) => {
        const userId = request.user?.id;

        if (!userId) throw new UnAuthorizedError('User not authenticated');

        const userRow = await this.userRepository.findById(userId);

        if (!userRow) {
            throw new RouteNotFoundError('User profile not found');
        }

        const user = this.userRepository.mapToCamelCase(userRow);
        const existingVerification = await this.identityVerificationRepository.getLatestByUserIdAndProvider(userId, 'sumsub');
        const existingApplicant =
            existingVerification?.providerApplicantId
                ? {
                      id: existingVerification.providerApplicantId,
                      levelName: existingVerification.providerLevelName,
                  }
                : await getSumsubApplicantByExternalUserId(userId);

        const applicant = existingApplicant
            ? existingApplicant
            : await createSumsubApplicant({
                  externalUserId: userId,
                  email: user.email,
                  phone: user.phoneNumber,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  levelName: input?.levelName ?? null,
              });

        const applicantId = applicant.id ?? applicant.applicantId;

        if (!applicantId) {
            throw new ServerError('Sumsub did not return an applicant identifier.');
        }

        const session = await createSumsubSdkAccessToken({
            externalUserId: userId,
            email: user.email,
            phone: user.phoneNumber,
            levelName: input?.levelName ?? applicant.levelName ?? existingVerification?.providerLevelName ?? null,
        });

        const verification = existingVerification
            ? await this.identityVerificationRepository.updateVerification(existingVerification.id, {
                  provider: 'sumsub',
                  status: 'pending',
                  notes: null,
                  reviewedAt: null,
                  providerApplicantId: applicantId,
                  providerLevelName: session.levelName ?? existingVerification.providerLevelName ?? null,
                  providerReviewStatus: 'pending',
                  providerReviewResult: null,
                  providerPayload: {
                      applicantId,
                      accessTokenUserId: session.userId,
                  },
              })
            : await this.identityVerificationRepository.createProviderVerification({
                  userId,
                  provider: 'sumsub',
                  status: 'pending',
                  providerApplicantId: applicantId,
                  providerLevelName: session.levelName ?? null,
                  providerReviewStatus: 'pending',
                  providerReviewResult: null,
                  providerPayload: {
                      applicantId,
                      accessTokenUserId: session.userId,
                  },
              });

        const nextStep = Math.max(user.onboardingStep ?? 0, 3);
        await this.userRepository.updateById(userId, {
            onboardingStep: nextStep,
        });

        return {
            code: HttpStatus.CREATED,
            message: 'KYC Session Created Successfully',
            data: {
                verification,
                session: {
                    applicantId,
                    token: session.token,
                    userId: session.userId,
                    levelName: session.levelName,
                    expiresInSeconds: session.ttlInSecs,
                },
            },
        };
    };
}

const createKycSession = new CreateKycSession(new IdentityVerificationRepository(), new UserRepository());

export default createKycSession;
