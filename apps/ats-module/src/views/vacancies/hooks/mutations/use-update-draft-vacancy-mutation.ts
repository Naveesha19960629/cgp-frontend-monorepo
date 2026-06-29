import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { VacancyForm } from '@/views/vacancies/types';
import { toCreateVacancyPayload } from '@/views/vacancies/utils';

const useUpdateDraftVacancyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      form,
      status,
    }: {
      id: string;
      form: VacancyForm;
      status?: string;
    }) =>
      vacancyService.updateDraftVacancy(
        id,
        toCreateVacancyPayload(form, status)
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
};

export { useUpdateDraftVacancyMutation };
