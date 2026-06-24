import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';

const useDeleteVacancyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vacancyService.deleteVacancy(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
};

export { useDeleteVacancyMutation };
