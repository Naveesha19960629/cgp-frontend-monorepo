import { secondaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

const useAddSchoolMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      displayValue: string;
      locationId?: string;
      url?: string;
    }) => secondaryEducationService.addSchool(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
};

export { useAddSchoolMutation };
