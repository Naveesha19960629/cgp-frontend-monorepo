import { tertiaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

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
