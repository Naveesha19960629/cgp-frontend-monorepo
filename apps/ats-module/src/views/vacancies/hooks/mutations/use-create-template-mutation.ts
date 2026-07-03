import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';
import {
  type TemplateFormState,
  buildCreateTemplatePayload,
} from '@/views/vacancies/templates/vacancy-template-form';

interface CreateTemplateArgs {
  state: TemplateFormState;
  templateName: string;
  refNumber?: string;
}

const useCreateTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ state, templateName, refNumber }: CreateTemplateArgs) =>
      vacancyTemplateService.createTemplate(
        buildCreateTemplatePayload(state, templateName, refNumber)
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vacancy-templates'] });
    },
  });
};

export { useCreateTemplateMutation };
