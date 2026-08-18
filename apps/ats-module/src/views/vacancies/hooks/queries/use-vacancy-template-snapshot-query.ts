import { useQuery } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';

const VACANCY_TEMPLATE_SNAPSHOT_QUERY_KEY = (vacancyId: string) =>
  ['vacancy-template-snapshot', vacancyId] as const;

const isValidVacancyId = (id: string) => id.trim().length > 0;

/**
 * The template snapshot captured when this vacancy was created from a template
 * (GET /vacancies/{id}/template-snapshots). Preferred over the live template
 * when restoring section/field visibility on edit — see DQCGP-2560 AC 8.
 *
 * `retry: false` because a 404 is an expected answer (vacancy not created from
 * a template, or created before snapshotting existed) that callers handle by
 * falling back to the live template; retrying it just delays the form.
 */
const useVacancyTemplateSnapshotQuery = (
  vacancyId: string,
  options?: { enabled?: boolean }
) => {
  const isEnabled = (options?.enabled ?? true) && isValidVacancyId(vacancyId);

  return useQuery({
    queryKey: VACANCY_TEMPLATE_SNAPSHOT_QUERY_KEY(vacancyId),
    queryFn: () => vacancyService.getVacancyTemplateSnapshot(vacancyId),
    enabled: isEnabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export { useVacancyTemplateSnapshotQuery, VACANCY_TEMPLATE_SNAPSHOT_QUERY_KEY };
