import { tertiaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

const useAddTertiaryAwardingBodyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      displayValue: string;
      locationId?: string;
      url?: string;
    }) => tertiaryEducationService.addTertiaryAwardingBody(params),
    onSuccess: () => {
      queryClient
        .invalidateQueries({
          queryKey: ['tertiary-awarding-bodies'],
        })
        .catch(() => {});
    },
  });
};

export { useAddTertiaryAwardingBodyMutation };
