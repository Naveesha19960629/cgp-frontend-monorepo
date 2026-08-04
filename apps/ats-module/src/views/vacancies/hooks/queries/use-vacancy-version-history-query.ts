import { useQuery } from '@tanstack/react-query';

import { versionHistoryService } from '@/views/vacancies/services';

const VACANCY_VERSION_HISTORY_QUERY_KEY = (id: string) =>
  ['vacancy-version-history', id] as const;

const isValidVacancyId = (id: string) => id.trim().length > 0;

const useVacancyVersionHistoryQuery = (
  id: string,
  options?: { enabled?: boolean }
) => {
  // The page renders the version list + Activity Log on load, so this
  // fetches eagerly by default (unlike a download-on-demand query).
  const isEnabled = (options?.enabled ?? true) && isValidVacancyId(id);

  return useQuery({
    queryKey: VACANCY_VERSION_HISTORY_QUERY_KEY(id),
    queryFn: () => versionHistoryService.getVacancyVersionHistory(id),
    enabled: isEnabled,
    refetchOnWindowFocus: false,
  });
};

export { useVacancyVersionHistoryQuery, VACANCY_VERSION_HISTORY_QUERY_KEY };
