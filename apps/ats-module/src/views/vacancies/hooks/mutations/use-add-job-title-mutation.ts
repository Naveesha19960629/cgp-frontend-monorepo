import { useMutation, useQueryClient } from '@tanstack/react-query';

import { jobTitleService } from '@/views/vacancies/services';

const useAddJobTitleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      jobTitleService.addJobTitle(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job-titles'] });
    },
  });
};

export { useAddJobTitleMutation };
