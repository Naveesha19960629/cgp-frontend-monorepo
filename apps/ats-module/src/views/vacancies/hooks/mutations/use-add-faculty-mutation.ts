import { tertiaryEducationService } from '@/views/vacancies/services';

import { useMutation, useQueryClient } from '@cgp/data-access';

const useAddFacultyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      tertiaryEducationService.addFaculty(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faculties'] });
    },
  });
};

export { useAddFacultyMutation };
