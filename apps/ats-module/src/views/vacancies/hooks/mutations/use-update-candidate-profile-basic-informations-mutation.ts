import { useMutation } from '@tanstack/react-query';

import { candidateProfileService } from '@/views/vacancies/services';
import type { ProfileRequirements } from '@/views/vacancies/types';

interface UpdateCandidateProfileBasicInformationsMutationArgs {
  candidateId: string;
  payload: ProfileRequirements;
}

const useUpdateCandidateProfileBasicInformationsMutation = () =>
  useMutation({
    mutationFn: ({
      candidateId,
      payload,
    }: UpdateCandidateProfileBasicInformationsMutationArgs) =>
      candidateProfileService.updateProfileBasicInformations(
        candidateId,
        payload
      ),
  });

export { useUpdateCandidateProfileBasicInformationsMutation };
export type { UpdateCandidateProfileBasicInformationsMutationArgs };
