import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sportLevelService } from '@/views/vacancies/services';

const useCreateSportLevelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => sportLevelService.createSportLevel(label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sport-levels'] });
    },
  });
};

export { useCreateSportLevelMutation };
