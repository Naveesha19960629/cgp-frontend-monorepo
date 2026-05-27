import { useMutation, useQueryClient } from '@tanstack/react-query';

import { industryService } from '@/views/vacancies/services';

const useCreateIndustryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => industryService.createIndustry(label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['industries'] });
    },
  });
};

export { useCreateIndustryMutation };
