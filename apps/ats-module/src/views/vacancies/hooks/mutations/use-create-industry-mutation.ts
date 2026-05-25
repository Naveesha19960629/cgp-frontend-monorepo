import { industryService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

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
