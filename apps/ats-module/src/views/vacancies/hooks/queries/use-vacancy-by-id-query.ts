import { useQuery } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';

const VACANCY_BY_ID_QUERY_KEY = (id: string) => ['vacancy', id] as const;

const useVacancyByIdQuery = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: VACANCY_BY_ID_QUERY_KEY(id),
    queryFn: () => vacancyService.getVacancyById(id),
    enabled: options?.enabled ?? true,
  });

export { useVacancyByIdQuery };
