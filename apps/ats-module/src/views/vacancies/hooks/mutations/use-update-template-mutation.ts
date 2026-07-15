import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';
import type { TemplateFormState } from '@/views/vacancies/types';
import { toUpdateTemplatePayload } from '@/views/vacancies/utils/vacancy-template-payload-helpers';

interface UpdateTemplateArgs {
  id: string;
  state: TemplateFormState;
  templateName: string;
}

const useUpdateTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, state, templateName }: UpdateTemplateArgs) =>
      vacancyTemplateService.updateTemplate(
        id,
        toUpdateTemplatePayload(state, templateName)
      ),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['vacancy-templates'] });
      void queryClient.invalidateQueries({
        queryKey: ['vacancy-template', id],
      });
    },
  });
};

export { useUpdateTemplateMutation };
