import { tertiaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

const useAddSpecializationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      tertiaryEducationService.addSpecialization(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
  });
};

export { useAddSpecializationMutation };
