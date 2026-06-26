import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sportService } from '@/views/vacancies/services';

const useCreateSportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => sportService.createSport(label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sports'] });
    },
  });
};

export { useCreateSportMutation };
