import { useQuery } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';

const NEXT_TEMPLATE_NAME_QUERY_KEY = [
  'vacancy-templates',
  'next-template-name',
] as const;

/**
 * Fetches the next auto-generated template name and its reference number,
 * used to pre-populate the Create Template form.
 *
 * Relies on the app-wide default staleTime/gcTime for caching — it is
 * explicitly invalidated (via the shared 'vacancy-templates' key prefix) by
 * useSaveVacancyAsTemplateMutation and useCreateTemplateMutation whenever a
 * template is saved/created, so the name only re-fetches when it's actually
 * stale.
 */
const useNextTemplateNameQuery = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: NEXT_TEMPLATE_NAME_QUERY_KEY,
    queryFn: () => vacancyTemplateService.getNextTemplateName(),
    enabled: options?.enabled ?? true,
  });

export { useNextTemplateNameQuery };
