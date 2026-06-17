import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { VacancyForm } from '@/views/vacancies/types';
import { toCreateVacancyPayload } from '@/views/vacancies/utils';

const useCreateVacancyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ form, status }: { form: VacancyForm; status?: string }) =>
      vacancyService.createVacancy(toCreateVacancyPayload(form, status)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
};

export { useCreateVacancyMutation };
