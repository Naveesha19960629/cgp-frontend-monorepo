import { useMutation, useQueryClient } from '@tanstack/react-query';

import { careerPathService } from '@/views/vacancies/services';

const useCreateCareerPathMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => careerPathService.createCareerPath(label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['career-paths'] });
    },
  });
};

export { useCreateCareerPathMutation };
