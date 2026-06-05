import { useQuery } from '@tanstack/react-query';

import { sportService } from '@/views/vacancies/services';

const SPORTS_QUERY_KEY = (search: string) => ['sports', search] as const;

const useSportsQuery = (search: string, enabled = true) =>
  useQuery({
    queryKey: SPORTS_QUERY_KEY(search),
    queryFn: () => sportService.getSports(search),
    enabled,
  });

export { useSportsQuery };
