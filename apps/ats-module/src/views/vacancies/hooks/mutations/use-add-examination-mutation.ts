import { secondaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

const useAddExaminationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      secondaryEducationService.addExamination(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['examinations'] });
    },
  });
};

export { useAddExaminationMutation };
