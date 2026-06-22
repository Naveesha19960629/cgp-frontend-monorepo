import { useQuery } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';

const VACANCY_BY_ID_QUERY_KEY = (id: string) => ['vacancy', id] as const;

const isValidVacancyId = (id: string) => id.trim().length > 0;

const useVacancyByIdQuery = (id: string, options?: { enabled?: boolean }) => {
  const isEnabled = (options?.enabled ?? true) && isValidVacancyId(id);

  return useQuery({
    queryKey: VACANCY_BY_ID_QUERY_KEY(id),
    queryFn: () => vacancyService.getVacancyById(id),
    enabled: isEnabled,
  });
};

export { useVacancyByIdQuery };
