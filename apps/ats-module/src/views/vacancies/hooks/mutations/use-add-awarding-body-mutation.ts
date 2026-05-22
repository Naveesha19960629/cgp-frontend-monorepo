import { secondaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

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
