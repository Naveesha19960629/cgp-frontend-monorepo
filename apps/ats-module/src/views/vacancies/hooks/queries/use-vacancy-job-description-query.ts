import { useQuery } from '@tanstack/react-query';

import { jobDescriptionService } from '@/views/vacancies/services';

const VACANCY_JOB_DESCRIPTION_QUERY_KEY = (id: string) =>
  ['vacancy-job-description', id] as const;

const isValidVacancyId = (id: string) => id.trim().length > 0;

const useVacancyJobDescriptionQuery = (
  id: string,
  options?: { enabled?: boolean }
) => {
  const isEnabled = (options?.enabled ?? true) && isValidVacancyId(id);

  return useQuery({
    queryKey: VACANCY_JOB_DESCRIPTION_QUERY_KEY(id),
    queryFn: () => jobDescriptionService.getVacancyJobDescription(id),
    enabled: isEnabled,
    refetchOnWindowFocus: false,
  });
};

export { useVacancyJobDescriptionQuery, VACANCY_JOB_DESCRIPTION_QUERY_KEY };
