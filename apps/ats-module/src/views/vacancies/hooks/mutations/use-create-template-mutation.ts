import { useMutation, useQueryClient } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';
import type { TemplateFormState } from '@/views/vacancies/types';
import { toCreateTemplatePayload } from '@/views/vacancies/utils/vacancy-template-payload-helpers';

interface CreateTemplateArgs {
  state: TemplateFormState;
  templateName: string;
  refNumber?: string;
}

const NEXT_TEMPLATE_NAME_QUERY_KEY = [
  'vacancy-templates',
  'next-template-name',
] as const;

const useCreateTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ state, templateName, refNumber }: CreateTemplateArgs) =>
      vacancyTemplateService.createTemplate(
        toCreateTemplatePayload(state, templateName, refNumber)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancy-templates'] });
      queryClient.invalidateQueries({
        queryKey: NEXT_TEMPLATE_NAME_QUERY_KEY,
      });
    },
  });
};

export { useCreateTemplateMutation };
