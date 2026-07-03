import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';
import type { VacancyTemplateQueryParams } from '@/views/vacancies/types';

const VACANCY_TEMPLATES_QUERY_KEY = (params: VacancyTemplateQueryParams) =>
  ['vacancy-templates', 'list', params] as const;

const useVacancyTemplatesQuery = (
  params: VacancyTemplateQueryParams,
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: VACANCY_TEMPLATES_QUERY_KEY(params),
    queryFn: () => vacancyTemplateService.searchTemplates(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

export { useVacancyTemplatesQuery };
