import { careerPathService } from '@/views/vacancies';

import { useQuery } from '@cgp/data-access';

const CAREER_PATHS_QUERY_KEY = (search: string) =>
  ['career-paths', search] as const;

const useCareerPathsQuery = (search: string = '') =>
  useQuery({
    queryKey: CAREER_PATHS_QUERY_KEY(search),
    queryFn: () => careerPathService.getAllCareerPaths(search),
  });

export { useCareerPathsQuery };
