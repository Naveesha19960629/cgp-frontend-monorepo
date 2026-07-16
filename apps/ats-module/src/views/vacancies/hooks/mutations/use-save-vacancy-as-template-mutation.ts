import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';
import type { SaveVacancyAsTemplatePayload } from '@/views/vacancies/types';

const useSaveVacancyAsTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveVacancyAsTemplatePayload) =>
      vacancyTemplateService.saveVacancyAsTemplate(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vacancy-templates'] });
    },
  });
};

export { useSaveVacancyAsTemplateMutation };
