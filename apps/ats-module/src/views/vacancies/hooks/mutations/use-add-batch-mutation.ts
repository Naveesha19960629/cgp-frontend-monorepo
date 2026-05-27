import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

const useAddBatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      tertiaryEducationService.addBatch(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

export { useAddBatchMutation };
