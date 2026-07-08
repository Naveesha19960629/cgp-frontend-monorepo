import { useMutation, useQueryClient } from '@tanstack/react-query';

import { jobDescriptionService } from '@/views/vacancies/services';
import type { UpdateVacancyJobDescriptionRequest } from '@/views/vacancies/types';

const useUpdateVacancyJobDescriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vacancyId,
      payload,
    }: {
      vacancyId: string;
      payload: UpdateVacancyJobDescriptionRequest;
    }) => jobDescriptionService.updateVacancyJobDescription(vacancyId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['vacancy-job-description', variables.vacancyId],
      });
    },
  });
};

export { useUpdateVacancyJobDescriptionMutation };
