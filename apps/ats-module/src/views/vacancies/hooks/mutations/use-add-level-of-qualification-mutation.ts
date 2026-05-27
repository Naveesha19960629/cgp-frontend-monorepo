import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

const useAddLevelOfQualificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      tertiaryEducationService.addLevelOfQualification(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['level-of-qualifications'],
      });
    },
  });
};

export { useAddLevelOfQualificationMutation };
