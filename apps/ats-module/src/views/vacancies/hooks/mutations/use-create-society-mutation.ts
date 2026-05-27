import { useMutation, useQueryClient } from '@tanstack/react-query';

import { societyService } from '@/views/vacancies/services';

const useCreateSocietyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => societyService.createSociety(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });
};

export { useCreateSocietyMutation };
