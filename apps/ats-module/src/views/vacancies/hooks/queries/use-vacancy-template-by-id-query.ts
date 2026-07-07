import { useQuery } from '@tanstack/react-query';

import { vacancyTemplateService } from '@/views/vacancies/services';

const VACANCY_TEMPLATE_BY_ID_QUERY_KEY = (id: string) =>
  ['vacancy-template', id] as const;

const isValidTemplateId = (id: string) => id.trim().length > 0;

const useVacancyTemplateByIdQuery = (
  id: string,
  options?: { enabled?: boolean }
) => {
  const isEnabled = (options?.enabled ?? true) && isValidTemplateId(id);

  return useQuery({
    queryKey: VACANCY_TEMPLATE_BY_ID_QUERY_KEY(id),
    queryFn: () => vacancyTemplateService.getTemplateById(id),
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export { useVacancyTemplateByIdQuery };
