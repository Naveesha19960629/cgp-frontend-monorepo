import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { VacancyToggleAction } from '@/views/vacancies/types';

const useToggleVacancyStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: VacancyToggleAction }) =>
      vacancyService.toggleVacancyActiveStatus(id, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
};

export { useToggleVacancyStatusMutation };
