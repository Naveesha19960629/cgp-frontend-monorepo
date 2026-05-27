import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

const useAddDepartmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      tertiaryEducationService.addDepartment(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export { useAddDepartmentMutation };
