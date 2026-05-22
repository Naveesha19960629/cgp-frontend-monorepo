import { tertiaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

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
