import { tertiaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

const useAddTertiaryAwardingBodyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      tertiaryEducationService.addTertiaryAwardingBody(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['tertiary-awarding-bodies'],
      });
    },
  });
};

export { useAddTertiaryAwardingBodyMutation };
