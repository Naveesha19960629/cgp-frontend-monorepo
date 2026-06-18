import { useQuery } from '@tanstack/react-query';

import { sportService } from '@/views/vacancies/services';
import type { SportItem } from '@/views/vacancies/types';

const SPORTS_QUERY_KEY = (search: string) => ['sports', search] as const;

const SPORTS_STALE_TIME = 5 * 60 * 1000;
const SPORTS_GC_TIME = 10 * 60 * 1000;

export function useSportsQuery(search: string, enabled = true) {
  const { data, isLoading, error } = useQuery<SportItem[]>({
    queryKey: SPORTS_QUERY_KEY(search),
    queryFn: () => sportService.getSports(search),
    enabled,
    staleTime: SPORTS_STALE_TIME,
    gcTime: SPORTS_GC_TIME,
  });

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}
