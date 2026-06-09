import { useMutation, useQueryClient } from '@tanstack/react-query';

import { disciplineService } from '@/views/vacancies/services';

const useAddDisciplineMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayValue: string) =>
      disciplineService.addDiscipline(displayValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['disciplines'] });
    },
  });
};

export { useAddDisciplineMutation };
