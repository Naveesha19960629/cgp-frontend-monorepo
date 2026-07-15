import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';

const useDeleteTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vacancyTemplateService.deleteTemplate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vacancy-templates'] });
    },
  });
};

export { useDeleteTemplateMutation };
