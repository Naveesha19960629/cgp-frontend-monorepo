import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { VacancyForm } from '@/views/vacancies/types';
import { toUpdateVacancyPayload } from '@/views/vacancies/utils';

const useUpdateVacancyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      form,
      existingStatus,
    }: {
      id: string;
      form: VacancyForm;
      existingStatus: string;
    }) =>
      vacancyService.updateVacancy(
        id,
        toUpdateVacancyPayload(form, existingStatus)
      ),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      await queryClient.invalidateQueries({
        queryKey: ['vacancy', variables.id],
      });
    },
  });
};

export { useUpdateVacancyMutation };
