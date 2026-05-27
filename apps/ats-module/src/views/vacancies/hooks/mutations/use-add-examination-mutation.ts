import { useMutation, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

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
