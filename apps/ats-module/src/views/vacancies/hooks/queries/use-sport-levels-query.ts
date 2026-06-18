import { useQuery } from '@tanstack/react-query';

import { sportLevelService } from '@/views/vacancies/services';
import type { JobLevelItem } from '@/views/vacancies/types';

const SPORT_LEVELS_QUERY_KEY = ['sport-levels'] as const;

function useSportLevelsQuery() {
  const { data, isLoading, error } = useQuery<JobLevelItem[]>({
    queryKey: SPORT_LEVELS_QUERY_KEY,
    queryFn: async () => {
      const levels = await sportLevelService.getAllSportLevels();
      console.log('sport-levels fetch result:', levels);
      return levels;
    },
    staleTime: Infinity,
  });
  return { data: data ?? [], isLoading, error };
}

export { useSportLevelsQuery };
