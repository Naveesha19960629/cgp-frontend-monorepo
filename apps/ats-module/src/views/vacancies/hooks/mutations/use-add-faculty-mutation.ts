import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

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
