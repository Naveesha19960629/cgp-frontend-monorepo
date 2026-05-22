import { tertiaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

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
