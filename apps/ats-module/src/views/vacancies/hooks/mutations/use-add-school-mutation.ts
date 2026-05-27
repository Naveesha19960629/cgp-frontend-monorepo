import { useMutation, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

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
