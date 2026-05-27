import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

const useAddQualificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      tertiaryEducationService.addQualification(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['qualifications'] });
    },
  });
};

export { useAddQualificationMutation };
