import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { VacancyForm } from '@/views/vacancies/types';
import { toCreateVacancyPayload } from '@/views/vacancies/utils';

const useUpdateVacancyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: VacancyForm }) =>
      vacancyService.updateVacancy(id, toCreateVacancyPayload(form)),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      void queryClient.invalidateQueries({ queryKey: ['vacancy', id] });
    },
  });
};

export { useUpdateVacancyMutation };
