import { useMutation, useQueryClient } from '@tanstack/react-query';

import { hobbyService } from '@/views/vacancies/services';

const useCreateHobbyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => hobbyService.createHobby(label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hobbies'] });
    },
  });
};

export { useCreateHobbyMutation };
