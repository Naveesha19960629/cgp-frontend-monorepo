import { useQuery } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';

const NEXT_TEMPLATE_NAME_QUERY_KEY = [
  'vacancy-templates',
  'next-template-name',
] as const;

/**
 * Fetches the next auto-generated template name and its reference number,
 * used to pre-populate the Create Template form.
 */
const useNextTemplateNameQuery = () =>
  useQuery({
    queryKey: NEXT_TEMPLATE_NAME_QUERY_KEY,
    queryFn: () => vacancyTemplateService.getNextTemplateName(),
    staleTime: 0,
    gcTime: 0,
  });

export { useNextTemplateNameQuery };
