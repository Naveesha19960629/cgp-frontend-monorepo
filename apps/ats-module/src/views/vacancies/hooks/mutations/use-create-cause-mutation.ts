import { useMutation, useQueryClient } from '@tanstack/react-query';

import { causeService } from '@/views/vacancies/services';

const useCreateCauseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => causeService.createCause(label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['causes'] });
    },
  });
};

export { useCreateCauseMutation };
