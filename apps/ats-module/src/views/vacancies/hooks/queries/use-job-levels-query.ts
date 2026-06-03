import { useQuery } from '@tanstack/react-query';

import { jobLevelService } from '@/views/vacancies/services';

const JOB_LEVELS_QUERY_KEY = ['levels'] as const;

const useJobLevelsQuery = () =>
  useQuery({
    queryKey: JOB_LEVELS_QUERY_KEY,
    queryFn: () => jobLevelService.getAllJobLevels(),
    staleTime: Infinity,
  });

export { useJobLevelsQuery };
