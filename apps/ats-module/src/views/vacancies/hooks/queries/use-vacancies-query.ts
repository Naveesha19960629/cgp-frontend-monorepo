import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { VacancyQueryParams } from '@/views/vacancies/types';

const VACANCIES_QUERY_KEY = (params: VacancyQueryParams) =>
  ['vacancies', params] as const;

const useVacanciesQuery = (
  params: VacancyQueryParams,
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: VACANCIES_QUERY_KEY(params),
    queryFn: () => vacancyService.getVacancies(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

export { useVacanciesQuery };
