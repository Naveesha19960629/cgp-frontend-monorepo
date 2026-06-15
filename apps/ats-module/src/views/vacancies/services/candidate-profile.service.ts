import type { ProfileRequirements } from '@/views/vacancies/types';

interface UpdateCandidateProfileBasicInformationsResponse {
  requestId: string;
  success: boolean;
  message: string;
}

const candidateProfileService = {
  updateProfileBasicInformations: (
    candidateId: string,
    payload: ProfileRequirements
  ): Promise<UpdateCandidateProfileBasicInformationsResponse> => {
    // Pending integration: backend contract and payload mapping are not finalized.
    // const response =
    //   await httpClient.put<UpdateCandidateProfileBasicInformationsResponse>(
    //     `/v1/candidates/${candidateId}/profile-basic-informations`,
    //     payload
    //   );
    // return response.data;

    return Promise.reject(
      new Error(
        `Pending API integration for /v1/candidates/{candidate_id}/profile-basic-informations (candidateId: ${candidateId}, payloadReady: ${String(Boolean(payload))})`
      )
    );
  },
};

export { candidateProfileService };
export type { UpdateCandidateProfileBasicInformationsResponse };
