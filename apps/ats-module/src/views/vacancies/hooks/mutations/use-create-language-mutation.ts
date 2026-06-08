import { useMutation, useQueryClient } from '@tanstack/react-query';

import { languageService } from '@/views/vacancies/services';

const useCreateLanguageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => languageService.createLanguage(label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['languages'] });
    },
  });
};

export { useCreateLanguageMutation };
