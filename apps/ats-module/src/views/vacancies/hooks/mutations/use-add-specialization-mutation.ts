import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

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
