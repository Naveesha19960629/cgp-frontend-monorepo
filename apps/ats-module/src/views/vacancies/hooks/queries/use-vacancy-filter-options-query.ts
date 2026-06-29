import { useQuery } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';

const VACANCY_FILTER_OPTIONS_QUERY_KEY = (search: string) =>
  ['vacancy-filter-options', search] as const;

const useVacancyFilterOptionsQuery = (search: string = '') =>
  useQuery({
    queryKey: VACANCY_FILTER_OPTIONS_QUERY_KEY(search),
    queryFn: () => vacancyService.getFilterOptions(search || undefined),
  });

export { useVacancyFilterOptionsQuery };
