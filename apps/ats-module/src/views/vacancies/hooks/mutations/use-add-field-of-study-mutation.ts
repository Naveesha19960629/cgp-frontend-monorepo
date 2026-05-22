import { secondaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

const useAddFieldOfStudyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      secondaryEducationService.addFieldOfStudy(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['field-of-studies'] });
    },
  });
};

export { useAddFieldOfStudyMutation };
