import { useMutation, useQueryClient } from '@tanstack/react-query';

import { careerPathService } from '@/views/vacancies/services';
import type { CreateCareerPathPayload } from '@/views/vacancies/types';

const useAddCareerPathMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCareerPathPayload) =>
      careerPathService.addCareerPath(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['career-paths'] });
    },
  });
};

export { useAddCareerPathMutation };
