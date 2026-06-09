import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

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
