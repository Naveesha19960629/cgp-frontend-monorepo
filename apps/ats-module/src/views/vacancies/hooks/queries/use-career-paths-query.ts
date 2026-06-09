import { useQuery } from '@tanstack/react-query';

import { careerPathService } from '@/views/vacancies';

const CAREER_PATHS_QUERY_KEY = (search: string, disciplineId?: string) =>
  ['career-paths', search, disciplineId ?? ''] as const;

const useCareerPathsQuery = (
  search: string = '',
  disciplineId?: string,
  enabled: boolean = true
) =>
  useQuery({
    queryKey: CAREER_PATHS_QUERY_KEY(search, disciplineId),
    queryFn: () => careerPathService.getAllCareerPaths(search, disciplineId),
    enabled,
  });

export { useCareerPathsQuery };
