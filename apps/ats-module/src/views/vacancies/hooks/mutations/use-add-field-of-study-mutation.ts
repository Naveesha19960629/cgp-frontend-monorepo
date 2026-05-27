import { useMutation, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

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
