import { useQuery } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';

/**
 * Fetches the next auto-generated template name (e.g. "Template 6") and its
 * reference number, used to pre-populate the Create Template form.
 */
const useNextTemplateNameQuery = () =>
  useQuery({
    queryKey: ['vacancy-templates', 'next-template-name'],
    queryFn: () => vacancyTemplateService.getNextTemplateName(),
    staleTime: 0,
    gcTime: 0,
  });

export { useNextTemplateNameQuery };
