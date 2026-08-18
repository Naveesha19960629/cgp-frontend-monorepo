import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { VacancyToggleAction } from '@/views/vacancies/types';

const useToggleVacancyStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: VacancyToggleAction }) =>
      vacancyService.toggleVacancyActiveStatus(id, action),
    // The toggle changes the vacancy's status, so the cached detail entry the
    // Edit page hydrates from must be invalidated alongside the list — its
    // 5-minute staleTime would otherwise keep serving the pre-toggle status.
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      void queryClient.invalidateQueries({ queryKey: ['vacancy', id] });
    },
  });
};

export { useToggleVacancyStatusMutation };
