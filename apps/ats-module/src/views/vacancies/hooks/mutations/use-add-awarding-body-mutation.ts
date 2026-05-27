import { useMutation, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

const useAddAwardingBodyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      secondaryEducationService.addAwardingBody(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['secondary-awarding-bodies'],
      });
    },
  });
};

export { useAddAwardingBodyMutation };
